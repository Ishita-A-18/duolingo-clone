"""Lesson sessions: the core loop.

    start()    -> deal exercises (answers stay on the server)
    answer()   -> grade one exercise, take a heart on a mistake
    complete() -> validate, award XP, advance the path, extend the streak

The client re-queues exercises answered wrongly (as Duolingo does), so a
session can only be completed once every dealt exercise has a correct answer.
"""
import json
import random
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.clock import Clock
from app.core.config import settings
from app.core.errors import ConflictError, DomainError, ForbiddenError, NotFoundError
from app.models import (
    Achievement,
    RewardKind,
    Exercise,
    Lesson,
    LessonSession,
    SessionAnswer,
    SessionExercise,
    SessionMode,
    SessionStatus,
    Skill,
    SkillProgress,
    Unit,
    User,
)
from app.services import achievements, hearts, path, rewards, streak
from app.services.grading import AnswerInput, GradeResult, grade

MAX_CROWNS = 5
PRACTICE_SIZE = 8
# Network slack for the last answer of a timed challenge.
DEADLINE_GRACE = timedelta(seconds=3)


# ------------------------------------------------------------------ start


def _exercise_query():
    return select(Exercise).options(
        selectinload(Exercise.options), selectinload(Exercise.accepted_answers)
    )


def start_skill_session(db: Session, user: User, skill_id: int, clock: Clock) -> LessonSession:
    """Start the next lesson of the active skill, or a review of a completed one."""
    now = clock.now()
    hearts.sync_hearts(user, now)
    if user.hearts <= 0:
        raise ConflictError("You're out of hearts!", code="out_of_hearts")

    _, units = path.build_path(db, user)
    node = path.find_node(units, skill_id)
    lessons = node.skill.lessons
    if node.state == path.NodeState.LOCKED:
        raise ForbiddenError("Complete the previous skills to unlock this one.", code="skill_locked")
    if node.state == path.NodeState.ACTIVE:
        lesson, mode = lessons[node.lessons_completed], SessionMode.LESSON
    else:
        # Rotate through the skill's lessons on each review so practice stays varied.
        lesson, mode = lessons[node.crowns % len(lessons)], SessionMode.REVIEW

    exercises = db.scalars(
        _exercise_query().where(Exercise.lesson_id == lesson.id).order_by(Exercise.position)
    ).all()
    return _create(db, user, mode, lesson.id, list(exercises), now)


def start_heart_practice(db: Session, user: User, clock: Clock) -> LessonSession:
    """Practice over everything learned so far. No hearts at risk; earns one back."""
    now = clock.now()
    progress = path.progress_map(db, user.id)

    def learned(lesson: Lesson) -> bool:
        p = progress.get(lesson.skill_id)
        return p is not None and lesson.position <= p.lessons_completed

    lesson_ids = [lesson.id for lesson in db.scalars(select(Lesson)) if learned(lesson)]
    if not lesson_ids:  # brand-new learner: practise the very first lesson
        first = db.scalar(
            select(Lesson.id)
            .join(Skill)
            .join(Unit)
            .order_by(Unit.position, Skill.position, Lesson.position)
            .limit(1)
        )
        lesson_ids = [first]
    pool = list(db.scalars(_exercise_query().where(Exercise.lesson_id.in_(lesson_ids))))
    picked = random.sample(pool, min(PRACTICE_SIZE, len(pool)))
    return _create(db, user, SessionMode.HEART_PRACTICE, None, picked, now)


def start_legendary(db: Session, user: User, skill_id: int, clock: Clock) -> LessonSession:
    """Timed challenge over a completed skill. Costs gems up front, like the original.

    The deadline and the mistake limit are enforced here on the server, so the
    challenge can't be won by tampering with the client-side timer.
    """
    now = clock.now()
    _, units = path.build_path(db, user)
    node = path.find_node(units, skill_id)
    if node.state != path.NodeState.COMPLETED:
        raise ForbiddenError("Finish this skill to unlock its Legendary challenge.", code="skill_not_completed")
    if user.gems < settings.legendary_gem_cost:
        raise ConflictError("Not enough gems.", code="not_enough_gems")

    lesson_ids = [lesson.id for lesson in node.skill.lessons]
    pool = list(db.scalars(_exercise_query().where(Exercise.lesson_id.in_(lesson_ids))))
    picked = random.sample(pool, min(settings.legendary_questions, len(pool)))
    user.gems -= settings.legendary_gem_cost
    deadline = now + timedelta(seconds=settings.legendary_seconds)
    # lesson_id points at the skill's first lesson so completion can find the skill.
    return _create(db, user, SessionMode.LEGENDARY, lesson_ids[0], picked, now, deadline)


def _create(
    db: Session, user: User, mode: SessionMode, lesson_id: int | None,
    exercises: list[Exercise], now: datetime, deadline: datetime | None = None,
) -> LessonSession:
    if not exercises:
        raise DomainError("This lesson has no exercises yet.", code="empty_lesson")
    session = LessonSession(
        id=str(uuid.uuid4()), user_id=user.id, lesson_id=lesson_id, mode=mode, started_at=now,
        deadline=deadline,
    )
    session.items = [SessionExercise(exercise_id=e.id, position=i) for i, e in enumerate(exercises)]
    db.add(session)
    db.commit()
    return session


def dealt_exercises(db: Session, session: LessonSession) -> list[Exercise]:
    ids = [i.exercise_id for i in session.items]
    by_id = {e.id: e for e in db.scalars(_exercise_query().where(Exercise.id.in_(ids)))}
    return [by_id[i] for i in ids]


# ------------------------------------------------------------------ answer


def get_session(db: Session, user: User, session_id: str) -> LessonSession:
    s = db.get(LessonSession, session_id)
    if s is None or s.user_id != user.id:
        raise NotFoundError("Session not found.")
    return s


def _active(db: Session, user: User, session_id: str) -> LessonSession:
    s = get_session(db, user, session_id)
    if s.status != SessionStatus.ACTIVE:
        raise ConflictError("This session is already over.", code="session_closed")
    return s


def _fail_if_late(db: Session, s: LessonSession, now: datetime) -> None:
    """Timed sessions: past the deadline the challenge is lost."""
    if s.deadline is not None and now > s.deadline + DEADLINE_GRACE:
        s.status = SessionStatus.FAILED
        s.completed_at = now
        db.commit()
        raise ConflictError("Time's up!", code="time_up")


@dataclass
class AnswerOutcome:
    result: GradeResult
    hearts: int
    next_heart_at: datetime | None
    challenge_failed: bool = False  # legendary: this mistake used up the allowance


def answer(
    db: Session, user: User, session_id: str, exercise_id: int, ans: AnswerInput, clock: Clock
) -> AnswerOutcome:
    now = clock.now()
    s = _active(db, user, session_id)
    if exercise_id not in {i.exercise_id for i in s.items}:
        raise NotFoundError("That exercise isn't part of this session.")
    _fail_if_late(db, s, now)
    hearts_at_risk = s.mode in (SessionMode.LESSON, SessionMode.REVIEW)

    hearts.sync_hearts(user, now)
    if hearts_at_risk and user.hearts <= 0:
        raise ConflictError("You're out of hearts!", code="out_of_hearts")

    exercise = db.scalar(_exercise_query().where(Exercise.id == exercise_id))
    result = grade(exercise, ans)

    db.add(
        SessionAnswer(
            session_id=s.id, exercise_id=exercise_id, is_correct=result.correct,
            answer=json.dumps(asdict(ans), ensure_ascii=False), answered_at=now,
        )
    )
    if result.correct:
        s.correct_count += 1
    else:
        s.mistake_count += 1
        if hearts_at_risk:
            hearts.lose_heart(user, now)
            s.hearts_lost += 1
    failed = s.mode == SessionMode.LEGENDARY and s.mistake_count > settings.legendary_mistakes_allowed
    if failed:
        s.status = SessionStatus.FAILED
        s.completed_at = now
    db.commit()
    return AnswerOutcome(result, user.hearts, hearts.next_heart_at(user), challenge_failed=failed)


def abandon(db: Session, user: User, session_id: str) -> None:
    s = _active(db, user, session_id)
    s.status = SessionStatus.ABANDONED
    db.commit()


# ------------------------------------------------------------------ complete


@dataclass
class Completion:
    session: LessonSession
    xp_earned: int
    accuracy: int  # % of exercises right on the first try
    duration_seconds: int
    streak: streak.StreakUpdate
    today_xp: int
    daily_goal_xp: int
    daily_goal_reached_now: bool
    skill_id: int | None = None
    skill_completed_now: bool = False
    crowns: int = 0
    unit_completed_now: bool = False
    heart_gained: bool = False
    gems_earned: int = 0  # daily-goal chest
    legendary_now: bool = False  # passed a Legendary challenge
    achievements_unlocked: list[Achievement] = field(default_factory=list)


def complete(db: Session, user: User, session_id: str, clock: Clock) -> Completion:
    now = clock.now()
    today = clock.today(user.timezone)
    s = _active(db, user, session_id)
    _fail_if_late(db, s, now)

    # Every dealt exercise must have been answered correctly at least once.
    first_try: dict[int, bool] = {}
    solved: set[int] = set()
    for a in s.answers:
        first_try.setdefault(a.exercise_id, a.is_correct)
        if a.is_correct:
            solved.add(a.exercise_id)
    dealt = {i.exercise_id for i in s.items}
    if solved != dealt:
        raise ConflictError("Finish every exercise first.", code="session_incomplete")

    accuracy = round(100 * sum(first_try.values()) / len(dealt))
    perfect = s.mistake_count == 0
    bonus = settings.perfect_lesson_bonus_xp if perfect else 0
    if s.mode == SessionMode.LESSON:
        xp = s.lesson.xp_reward + bonus
    elif s.mode == SessionMode.REVIEW:
        xp = settings.review_xp + bonus
    elif s.mode == SessionMode.LEGENDARY:
        xp = settings.legendary_xp
    else:
        xp = settings.heart_practice_xp

    hearts.sync_hearts(user, now)
    goal_met_before = streak.today_xp(db, user.id, today) >= user.daily_goal_xp
    streak_update = streak.record_activity(db, user, today, xp)
    user.total_xp += xp
    db.flush()
    today_total = streak.today_xp(db, user.id, today)

    out = Completion(
        session=s,
        xp_earned=xp,
        accuracy=accuracy,
        duration_seconds=max(1, int((now - s.started_at).total_seconds())),
        streak=streak_update,
        today_xp=today_total,
        daily_goal_xp=user.daily_goal_xp,
        daily_goal_reached_now=not goal_met_before and today_total >= user.daily_goal_xp,
    )

    if out.daily_goal_reached_now and rewards.grant(
        db, user, rewards.daily_goal_key(today), RewardKind.DAILY_GOAL, settings.daily_goal_gems, now
    ):
        out.gems_earned = settings.daily_goal_gems

    if s.mode == SessionMode.HEART_PRACTICE:
        out.heart_gained = user.hearts < settings.max_hearts
        hearts.gain_heart(user, now)
    else:
        _advance_skill(db, user, s.lesson, s.mode, now, out)

    s.status = SessionStatus.COMPLETED
    s.completed_at = now
    s.xp_earned = xp
    db.flush()
    out.achievements_unlocked = achievements.evaluate(db, user, now)
    db.commit()
    return out


def _advance_skill(
    db: Session, user: User, lesson: Lesson, mode: SessionMode, now: datetime, out: Completion
) -> None:
    skill = lesson.skill
    sp = db.scalar(
        select(SkillProgress).where(
            SkillProgress.user_id == user.id, SkillProgress.skill_id == skill.id
        )
    )
    if sp is None:
        sp = SkillProgress(user_id=user.id, skill_id=skill.id, lessons_completed=0, crowns=0)
        db.add(sp)

    # Only the *next* lesson advances progress; replaying an old one is harmless.
    if mode == SessionMode.LESSON and lesson.position == sp.lessons_completed + 1:
        sp.lessons_completed += 1
        if sp.lessons_completed >= len(skill.lessons):
            sp.completed_at = now
            sp.crowns = max(sp.crowns, 1)
            out.skill_completed_now = True
            db.flush()
            done = path.progress_map(db, user.id)
            out.unit_completed_now = all(
                k.id in done and done[k.id].completed_at is not None for k in skill.unit.skills
            )
    elif mode == SessionMode.REVIEW:
        sp.crowns = min(MAX_CROWNS, sp.crowns + 1)
    elif mode == SessionMode.LEGENDARY:
        sp.legendary_at = sp.legendary_at or now
        sp.crowns = MAX_CROWNS
        out.legendary_now = True
    out.skill_id = skill.id
    out.crowns = sp.crowns

"""Create tables and seed course content, achievements, the default learner
and leaderboard competitors.

    python -m app.seed.run           # seed if empty
    python -m app.seed.run --reset   # drop everything and reseed
"""
import random
import sys
from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.clock import load_clock
from app.core.config import settings
from app.db import Base, SessionLocal, engine
from app.models import (
    Achievement,
    AchievementMetric,
    Course,
    DailyActivity,
    LessonSession,
    SessionMode,
    SessionStatus,
    Skill,
    SkillProgress,
    Unit,
    User,
)
from app.seed.content import ACHIEVEMENTS, BOTS, COURSE, UNITS
from app.seed.generator import build_lessons
from app.services import achievements
from app.services.leaderboard import week_start


def seed_course(db: Session) -> Course:
    course = Course(**COURSE)
    for u_pos, unit in enumerate(UNITS, 1):
        u = Unit(position=u_pos, section=1, title=unit.title, description=unit.description, color=unit.color)
        for s_pos, skill in enumerate(unit.skills, 1):
            u.skills.append(
                Skill(
                    position=s_pos,
                    title=skill.title,
                    icon=skill.icon,
                    lessons=build_lessons(skill, seed=u_pos * 100 + s_pos),
                )
            )
        course.units.append(u)
    db.add(course)
    db.flush()
    return course


def seed_achievements(db: Session) -> None:
    pos = 0
    for metric, title, icon, color, template, thresholds in ACHIEVEMENTS:
        for n in thresholds:
            desc = template.format(n=n)
            if n == 1:
                desc = desc.replace("lessons", "lesson").replace("skills", "skill")
            db.add(
                Achievement(
                    key=f"{metric}_{n}", title=title, description=desc, icon=icon, color=color,
                    metric=AchievementMetric(metric), threshold=n, position=pos,
                )
            )
        pos += 1


def _session(user: User, lesson_id: int, mode: SessionMode, when: datetime, xp: int, mistakes: int):
    return LessonSession(
        id=f"seed-{user.username}-{lesson_id}-{mode.value}-{when:%Y%m%d%H%M}",
        user_id=user.id, lesson_id=lesson_id, mode=mode, status=SessionStatus.COMPLETED,
        started_at=when - timedelta(minutes=3), completed_at=when,
        correct_count=7, mistake_count=mistakes, xp_earned=xp,
    )


def seed_learner(db: Session, course: Course, now: datetime, today: date) -> User:
    """A learner part-way through unit 1 on a 4-day streak, so every screen has data."""
    rng = random.Random(7)
    user = User(
        username=settings.default_username, display_name="Alex", avatar_color="blue",
        timezone=settings.default_timezone, created_at=now - timedelta(days=21),
        active_course_id=course.id, gems=520, hearts=4, hearts_updated_at=now - timedelta(minutes=20),
        daily_goal_xp=20,
    )
    db.add(user)
    db.flush()

    skills = [s for u in course.units for s in u.skills]
    # Skill 1 complete + reviewed twice, skill 2 complete + reviewed once, skill 3
    # one lesson in. 7 lessons + 3 reviews = 10 completed sessions, exactly enough
    # to have unlocked leaderboards (settings.league_unlock_lessons).
    plan = [(skills[0], 3, 3), (skills[1], 3, 2), (skills[2], 1, 0)]
    finished = [(sk, lesson) for sk, n, _ in plan for lesson in sk.lessons[:n]]
    # Spread lessons over past days: an older run, a gap (broken streak), then 4 days in a row.
    days = [today - timedelta(days=d) for d in (9, 8, 4, 3, 2, 2, 1)]
    xp_by_day: dict[date, list[int]] = {}
    for (sk, lesson), day in zip(finished, days):
        mistakes = rng.choice([0, 0, 1, 2])
        xp = lesson.xp_reward + (settings.perfect_lesson_bonus_xp if mistakes == 0 else 0)
        when = datetime.combine(day, datetime.min.time()) + timedelta(hours=18)
        db.add(_session(user, lesson.id, SessionMode.LESSON, when, xp, mistakes))
        xp_by_day.setdefault(day, []).append(xp)
    reviews = [(skills[0].lessons[0], 1), (skills[0].lessons[1], 8), (skills[1].lessons[0], 3)]
    for lesson, days_ago in reviews:
        review_day = today - timedelta(days=days_ago)
        db.add(_session(user, lesson.id, SessionMode.REVIEW,
                        datetime.combine(review_day, datetime.min.time()) + timedelta(hours=20),
                        settings.review_xp, 1))
        xp_by_day.setdefault(review_day, []).append(settings.review_xp)

    for day, xps in xp_by_day.items():
        db.add(DailyActivity(user_id=user.id, date=day, xp_earned=sum(xps), lessons_completed=len(xps)))
    user.total_xp = sum(sum(x) for x in xp_by_day.values())
    user.current_streak, user.longest_streak = 4, 4
    user.last_streak_date = today - timedelta(days=1)

    for sk, n, crowns in plan:
        db.add(SkillProgress(
            user_id=user.id, skill_id=sk.id, lessons_completed=n, crowns=crowns,
            completed_at=now - timedelta(days=2) if n == len(sk.lessons) else None,
        ))
    db.flush()
    achievements.evaluate(db, user, now)
    return user


def seed_bots(db: Session, course: Course, now: datetime, today: date) -> None:
    """Leaderboard competitors with XP over the last two weeks and the current one,
    so past leagues (used for "Top 3 finishes") are real competitions too."""
    rng = random.Random(42)
    start = week_start(today)
    for username, name, color in BOTS:
        bot = User(
            username=username, display_name=name, avatar_color=color, is_bot=True,
            timezone=settings.default_timezone, active_course_id=course.id,
            created_at=now - timedelta(days=rng.randint(30, 400)),
            current_streak=rng.randint(0, 60), last_streak_date=today - timedelta(days=1),
        )
        bot.longest_streak = bot.current_streak + rng.randint(0, 30)
        db.add(bot)
        db.flush()
        earned = 0
        day = start - timedelta(days=14)
        while day <= today:
            if rng.random() < 0.75:
                xp = rng.choice([10, 15, 20, 25, 30, 45, 60])
                if day == today:
                    xp //= 2
                db.add(DailyActivity(user_id=bot.id, date=day, xp_earned=xp, lessons_completed=xp // 10))
                earned += xp
            day += timedelta(days=1)
        bot.total_xp = earned + rng.randint(300, 6000)


def seed(db: Session) -> None:
    clock = load_clock(db)
    now, today = clock.now(), clock.today(settings.default_timezone)
    course = seed_course(db)
    seed_achievements(db)
    db.flush()
    seed_learner(db, course, now, today)
    seed_bots(db, course, now, today)
    db.commit()


def init_database(seed_if_empty: bool = True) -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if seed_if_empty and not db.scalar(select(func.count()).select_from(Course)):
            seed(db)


def reset_database() -> None:
    Base.metadata.drop_all(engine)
    init_database(seed_if_empty=True)


if __name__ == "__main__":
    if "--reset" in sys.argv:
        reset_database()
    else:
        init_database()
    print("Database ready.")

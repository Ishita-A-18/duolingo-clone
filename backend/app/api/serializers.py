"""Map domain objects to response schemas. Keeps routers thin and services
free of any knowledge about the wire format."""
import json
import random

from app.models import Exercise, ExerciseType, LessonSession, SessionMode, User
from app.schemas.learn import (
    ChestOut,
    CompletionOut,
    ExerciseOut,
    OptionOut,
    PairOut,
    PathOut,
    SessionOut,
    SkillOut,
    StreakOut,
    UnitOut,
    UnlockedAchievementOut,
)
from app.schemas.user import (
    AchievementOut,
    CourseBrief,
    DayActivity,
    LeaderboardOut,
    MeOut,
    ProfileOut,
    StandingOut,
)
from app.core.config import settings
from app.services import leaderboard, rewards, sessions, users
from app.services.path import UnitNode


def me_out(s: users.Summary) -> MeOut:
    u = s.user
    return MeOut(
        id=u.id,
        username=u.username,
        display_name=u.display_name,
        avatar_color=u.avatar_color,
        joined_at=u.created_at,
        course=CourseBrief.model_validate(s.course, from_attributes=True) if s.course else None,
        total_xp=u.total_xp,
        gems=u.gems,
        hearts=s.hearts,
        max_hearts=s.max_hearts,
        next_heart_at=s.next_heart_at,
        next_heart_in_seconds=s.next_heart_in_seconds,
        heart_refill_cost=s.heart_refill_cost,
        free_refill_available=s.free_refill_available,
        streak=s.streak,
        longest_streak=u.longest_streak,
        streak_extended_today=s.streak_extended_today,
        week=[DayActivity(date=d, xp=xp) for d, xp in s.week],
        daily_goal_xp=u.daily_goal_xp,
        today_xp=s.today_xp,
        sound_enabled=u.sound_enabled,
        animations_enabled=u.animations_enabled,
        motivational_messages=u.motivational_messages,
        listening_enabled=u.listening_enabled,
    )


def profile_out(p: users.Profile) -> ProfileOut:
    return ProfileOut(
        me=me_out(p.summary),
        lessons_completed=p.lessons_completed,
        crowns=p.crowns,
        skills_completed=p.skills_completed,
        total_skills=p.total_skills,
        league=p.league,
        league_rank=p.league_rank,
        top3_finishes=p.top3_finishes,
        achievements=[
            AchievementOut(**{**a.__dict__, "metric": a.metric.value}) for a in p.achievements
        ],
    )


def leaderboard_out(league: leaderboard.League, me: User) -> LeaderboardOut:
    return LeaderboardOut(
        league=league.name,
        week_start=league.week_start,
        days_left=league.days_left,
        promotion_zone=league.promotion_zone,
        unlocked=league.unlocked,
        lessons_to_unlock=league.lessons_to_unlock,
        standings=[
            StandingOut(
                rank=s.rank,
                user_id=s.user.id,
                display_name=s.user.display_name,
                avatar_color=s.user.avatar_color,
                weekly_xp=s.weekly_xp,
                is_me=s.user.id == me.id,
            )
            for s in league.standings
        ],
    )


def path_out(course, units: list[UnitNode], claimed: set[str]) -> PathOut:
    return PathOut(
        course_id=course.id,
        course_title=course.title,
        units=[
            UnitOut(
                id=u.unit.id,
                position=u.unit.position,
                section=u.unit.section,
                title=u.unit.title,
                description=u.unit.description,
                color=u.unit.color,
                state=u.state.value,
                skills=[
                    SkillOut(
                        id=n.skill.id,
                        title=n.skill.title,
                        icon=n.skill.icon,
                        state=n.state.value,
                        lessons_completed=n.lessons_completed,
                        total_lessons=n.total_lessons,
                        crowns=n.crowns,
                        max_crowns=sessions.MAX_CROWNS,
                    )
                    for n in u.skills
                ],
                chest=ChestOut(
                    state=rewards.chest_state(u, claimed),
                    gems=settings.unit_chest_gems,
                    after_skill=rewards.chest_after(u),
                ),
            )
            for u in units
        ],
    )


def exercise_out(e: Exercise) -> ExerciseOut:
    is_pairs = e.type == ExerciseType.MATCH_PAIRS
    return ExerciseOut(
        id=e.id,
        type=e.type.value,
        instruction=e.instruction,
        prompt=e.prompt,
        prompt_language=e.prompt_language,
        sentence=e.sentence,
        hints=json.loads(e.prompt_hints) if e.prompt_hints else {},
        options=[] if is_pairs else [OptionOut(id=o.id, text=o.text, image=o.image) for o in e.options],
        pairs=[PairOut(id=o.id, left=o.text, right=o.match_text or "") for o in e.options]
        if is_pairs
        else [],
    )


def session_out(s: LessonSession, exercises: list[Exercise]) -> SessionOut:
    lesson = s.lesson
    skill = lesson.skill if lesson else None
    dealt = list(exercises)
    if s.mode == SessionMode.HEART_PRACTICE:
        random.shuffle(dealt)
    return SessionOut(
        id=s.id,
        mode=s.mode.value,
        skill_id=skill.id if skill else None,
        skill_title=skill.title if skill else None,
        lesson_position=lesson.position if lesson else None,
        total_lessons=len(skill.lessons) if skill else None,
        hearts_at_risk=s.mode != SessionMode.HEART_PRACTICE,
        exercises=[exercise_out(e) for e in dealt],
    )


def completion_out(c: sessions.Completion, user: User) -> CompletionOut:
    return CompletionOut(
        xp_earned=c.xp_earned,
        accuracy=c.accuracy,
        duration_seconds=c.duration_seconds,
        mistakes=c.session.mistake_count,
        streak=StreakOut(
            previous=c.streak.previous, current=c.streak.current, extended_today=c.streak.extended_today
        ),
        today_xp=c.today_xp,
        daily_goal_xp=c.daily_goal_xp,
        daily_goal_reached_now=c.daily_goal_reached_now,
        skill_id=c.skill_id,
        skill_completed_now=c.skill_completed_now,
        crowns=c.crowns,
        unit_completed_now=c.unit_completed_now,
        heart_gained=c.heart_gained,
        gems_earned=c.gems_earned,
        gems=user.gems,
        hearts=user.hearts,
        total_xp=user.total_xp,
        achievements_unlocked=[
            UnlockedAchievementOut(
                key=a.key, title=a.title, description=a.description, icon=a.icon, color=a.color
            )
            for a in c.achievements_unlocked
        ],
    )

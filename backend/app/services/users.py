"""Read models for the current learner (top bar, profile) and settings updates."""
from dataclasses import dataclass
from datetime import date, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.clock import Clock
from app.core.config import settings
from app.core.errors import DomainError, NotFoundError
from app.models import Course, LessonSession, SessionStatus, SkillProgress, User
from app.services import achievements, hearts, leaderboard, path, rewards, streak

DAILY_GOAL_CHOICES = (10, 20, 30, 50)  # Casual, Regular, Serious, Intense


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found.")
    return user


@dataclass
class Summary:
    """Everything the always-visible top bar needs, in one request."""

    user: User
    course: Course | None
    hearts: int
    max_hearts: int
    next_heart_at: datetime | None
    next_heart_in_seconds: int | None  # relative to the (simulated) server clock
    heart_refill_cost: int
    free_refill_available: bool
    streak: int
    streak_extended_today: bool
    today_xp: int
    week: list[tuple[date, int]]


def summary(db: Session, user: User, clock: Clock) -> Summary:
    now, today = clock.now(), clock.today(user.timezone)
    hearts.sync_hearts(user, now)
    db.commit()  # persist any regenerated hearts
    nxt = hearts.next_heart_at(user)
    return Summary(
        user=user,
        course=db.get(Course, user.active_course_id) if user.active_course_id else None,
        hearts=user.hearts,
        max_hearts=settings.max_hearts,
        next_heart_at=nxt,
        next_heart_in_seconds=max(0, int((nxt - now).total_seconds())) if nxt else None,
        heart_refill_cost=settings.heart_refill_gem_cost,
        free_refill_available=rewards.free_refill_available(db, user),
        streak=streak.effective_streak(user, today),
        streak_extended_today=streak.extended_today(user, today),
        today_xp=streak.today_xp(db, user.id, today),
        week=streak.week_activity(db, user.id, today),
    )


def update_settings(
    db: Session, user: User, *, display_name: str | None, daily_goal_xp: int | None,
    sound_enabled: bool | None, timezone: str | None = None, **toggles: bool | None,
) -> User:
    if timezone is not None:
        try:
            ZoneInfo(timezone)
        except (ZoneInfoNotFoundError, ValueError):
            raise DomainError("Unknown timezone.", code="invalid_timezone") from None
        user.timezone = timezone
    if daily_goal_xp is not None:
        if daily_goal_xp not in DAILY_GOAL_CHOICES:
            raise DomainError(f"Daily goal must be one of {DAILY_GOAL_CHOICES}.", code="invalid_goal")
        user.daily_goal_xp = daily_goal_xp
    if display_name is not None:
        name = display_name.strip()
        if not 1 <= len(name) <= 40:
            raise DomainError("Name must be 1-40 characters.", code="invalid_name")
        user.display_name = name
    if sound_enabled is not None:
        user.sound_enabled = sound_enabled
    # Remaining on/off lesson preferences map 1:1 to user columns.
    for name in ("animations_enabled", "motivational_messages", "listening_enabled"):
        if toggles.get(name) is not None:
            setattr(user, name, toggles[name])
    db.commit()
    return user


@dataclass
class Profile:
    summary: Summary
    lessons_completed: int
    crowns: int
    skills_completed: int
    total_skills: int
    league: str | None  # None until leagues unlock
    league_rank: int | None
    top3_finishes: int
    achievements: list[achievements.AchievementFamily]


def profile(db: Session, user: User, clock: Clock) -> Profile:
    s = summary(db, user, clock)
    lessons = db.scalar(
        select(func.count()).select_from(LessonSession).where(
            LessonSession.user_id == user.id, LessonSession.status == SessionStatus.COMPLETED
        )
    )
    crowns = db.scalar(
        select(func.coalesce(func.sum(SkillProgress.crowns), 0)).where(SkillProgress.user_id == user.id)
    )
    _, units = path.build_path(db, user)
    nodes = [n for u in units for n in u.skills]
    league = leaderboard.weekly_league(db, user, clock.today(user.timezone))
    rank = next((st.rank for st in league.standings if st.user.id == user.id), None)
    return Profile(
        summary=s,
        lessons_completed=lessons or 0,
        crowns=crowns or 0,
        skills_completed=sum(n.state == path.NodeState.COMPLETED for n in nodes),
        total_skills=len(nodes),
        league=league.name if league.unlocked else None,
        league_rank=rank,
        top3_finishes=leaderboard.top3_finishes(db, user, clock.today(user.timezone)),
        achievements=achievements.families(db, user),
    )

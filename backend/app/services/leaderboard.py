"""Weekly league leaderboard.

Ranks learners by XP earned since Monday of the current week (the viewer's
local week), summed from `daily_activity`. Seeded competitors are regular
users with `is_bot=True`, so the same query ranks real and seeded users.

Like the original, leagues are locked for brand-new learners: a learner joins
once they've completed `settings.league_unlock_lessons` lessons. Until then
they see an "Unlock Leaderboards!" teaser and don't appear in anyone's league.
"""
from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import DailyActivity, LessonSession, SessionStatus, User

LEAGUE_NAME = "Bronze"
PROMOTION_ZONE = 7  # top N advance to the next league at the end of the week
LEAGUE_SIZE = 30


@dataclass
class Standing:
    rank: int
    user: User
    weekly_xp: int


@dataclass
class League:
    name: str
    week_start: date
    days_left: int
    promotion_zone: int
    unlocked: bool
    lessons_to_unlock: int
    standings: list[Standing]


def week_start(today: date) -> date:
    return today - timedelta(days=today.weekday())


def _completed_lessons():
    """Correlated count of a user's completed sessions."""
    return (
        select(func.count())
        .select_from(LessonSession)
        .where(LessonSession.user_id == User.id, LessonSession.status == SessionStatus.COMPLETED)
        .correlate(User)
        .scalar_subquery()
    )


def lessons_to_unlock(db: Session, user: User) -> int:
    done = db.scalar(
        select(func.count())
        .select_from(LessonSession)
        .where(LessonSession.user_id == user.id, LessonSession.status == SessionStatus.COMPLETED)
    )
    return max(0, settings.league_unlock_lessons - (done or 0))


def weekly_league(db: Session, viewer: User, today: date) -> League:
    start = week_start(today)
    remaining = lessons_to_unlock(db, viewer)
    base = League(
        name=LEAGUE_NAME,
        week_start=start,
        days_left=6 - today.weekday(),
        promotion_zone=PROMOTION_ZONE,
        unlocked=remaining == 0,
        lessons_to_unlock=remaining,
        standings=[],
    )
    if not base.unlocked:
        return base  # locked learners see a teaser, not other people's standings

    rows = _ranked(db, start, today)
    base.standings = [Standing(rank=i + 1, user=u, weekly_xp=xp) for i, (u, xp) in enumerate(rows)]
    return base


def _ranked(db: Session, first_day: date, last_day: date) -> list[tuple[User, int]]:
    """League members ranked by XP earned between two dates (inclusive)."""
    weekly = (
        select(DailyActivity.user_id, func.sum(DailyActivity.xp_earned).label("xp"))
        .where(DailyActivity.date >= first_day, DailyActivity.date <= last_day)
        .group_by(DailyActivity.user_id)
        .subquery()
    )
    xp_col = func.coalesce(weekly.c.xp, 0)
    rows = db.execute(
        select(User, xp_col)
        .outerjoin(weekly, weekly.c.user_id == User.id)
        # Seeded competitors always compete; real learners once they've unlocked leagues.
        .where(or_(User.is_bot.is_(True), _completed_lessons() >= settings.league_unlock_lessons))
        .order_by(xp_col.desc(), User.display_name)
        .limit(LEAGUE_SIZE)
    ).all()
    return [(u, int(xp)) for u, xp in rows]


def top3_finishes(db: Session, user: User, today: date) -> int:
    """How many finished weeks the learner ended in 1st-3rd place.

    League history isn't stored separately: each past week is re-ranked from
    `daily_activity` with the same query as the live league. Only weeks where
    the learner earned XP can count, so those are the only ones checked.
    """
    current = week_start(today)
    active_days = db.scalars(
        select(DailyActivity.date).where(
            DailyActivity.user_id == user.id, DailyActivity.date < current, DailyActivity.xp_earned > 0
        )
    )
    finishes = 0
    for start in sorted({week_start(d) for d in active_days}):
        ranked = _ranked(db, start, start + timedelta(days=6))
        top3 = [u.id for u, xp in ranked[:3] if xp > 0]
        finishes += user.id in top3
    return finishes

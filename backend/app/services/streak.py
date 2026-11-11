"""Streak + daily-activity bookkeeping.

A streak is the number of consecutive local calendar days on which the learner
completed at least one lesson. We store the running count and the last day it
was extended (`last_streak_date`), and decide on read whether it is still alive:

    last_streak_date == today       -> alive, already extended today
    last_streak_date == yesterday   -> alive, at risk (do a lesson today!)
    anything older                  -> broken, shows 0

Days come from the simulated Clock, so "tomorrow" can be tested from Settings.
"""
from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DailyActivity, User


@dataclass(frozen=True)
class StreakUpdate:
    previous: int
    current: int
    extended_today: bool  # True if this activity was the first of the day


def effective_streak(user: User, today: date) -> int:
    last = user.last_streak_date
    if last is None:
        return 0
    if last >= today - timedelta(days=1):
        return user.current_streak
    return 0


def extended_today(user: User, today: date) -> bool:
    return user.last_streak_date is not None and user.last_streak_date >= today


def get_activity(db: Session, user_id: int, day: date) -> DailyActivity | None:
    return db.scalar(
        select(DailyActivity).where(DailyActivity.user_id == user_id, DailyActivity.date == day)
    )


def today_xp(db: Session, user_id: int, today: date) -> int:
    row = get_activity(db, user_id, today)
    return row.xp_earned if row else 0


def record_activity(db: Session, user: User, today: date, xp: int) -> StreakUpdate:
    """Log XP for today and extend the streak if this is today's first lesson."""
    row = get_activity(db, user.id, today)
    if row is None:
        row = DailyActivity(user_id=user.id, date=today, xp_earned=0, lessons_completed=0)
        db.add(row)
    row.xp_earned += xp
    row.lessons_completed += 1

    previous = effective_streak(user, today)
    if extended_today(user, today):
        return StreakUpdate(previous=previous, current=previous, extended_today=False)

    user.current_streak = previous + 1
    user.last_streak_date = today
    user.longest_streak = max(user.longest_streak, user.current_streak)
    return StreakUpdate(previous=previous, current=user.current_streak, extended_today=True)


def week_activity(db: Session, user_id: int, today: date, days: int = 7) -> list[tuple[date, int]]:
    """(day, xp) for the last `days` days ending today, oldest first."""
    start = today - timedelta(days=days - 1)
    rows = db.scalars(
        select(DailyActivity).where(
            DailyActivity.user_id == user_id,
            DailyActivity.date >= start,
            DailyActivity.date <= today,
        )
    ).all()
    by_day = {r.date: r.xp_earned for r in rows}
    return [(start + timedelta(days=i), by_day.get(start + timedelta(days=i), 0)) for i in range(days)]

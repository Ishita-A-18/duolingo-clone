"""Simulated clock.

All time-dependent game logic (streaks, heart regeneration, daily goals,
weekly leaderboard) asks a Clock for "now" instead of calling datetime.now()
directly. The clock adds a persisted day offset, so a tester can jump to
"tomorrow" from the Settings page and watch a streak extend or break.

Datetimes are stored as naive UTC throughout the app (SQLite has no tz type);
calendar dates are derived per user from their IANA timezone.
"""
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core.timeutil import utcnow
from app.models.system import AppSetting

CLOCK_OFFSET_KEY = "clock_offset_days"


@dataclass(frozen=True)
class Clock:
    offset_days: int = 0
    fixed_now: datetime | None = None  # for tests

    def now(self) -> datetime:
        base = self.fixed_now or utcnow()
        return base + timedelta(days=self.offset_days)

    def today(self, tz_name: str) -> date:
        return to_local_date(self.now(), tz_name)


def to_local_date(naive_utc: datetime, tz_name: str) -> date:
    try:
        tz = ZoneInfo(tz_name)
    except Exception:  # unknown tz string -> fall back to UTC
        tz = ZoneInfo("UTC")
    return naive_utc.replace(tzinfo=timezone.utc).astimezone(tz).date()


def get_offset_days(db: Session) -> int:
    row = db.get(AppSetting, CLOCK_OFFSET_KEY)
    return int(row.value) if row else 0


def set_offset_days(db: Session, days: int) -> None:
    row = db.get(AppSetting, CLOCK_OFFSET_KEY)
    if row is None:
        db.add(AppSetting(key=CLOCK_OFFSET_KEY, value=str(days)))
    else:
        row.value = str(days)
    db.commit()


def load_clock(db: Session) -> Clock:
    return Clock(offset_days=get_offset_days(db))

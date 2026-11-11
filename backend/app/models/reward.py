"""Gem rewards a learner has collected (path chests, daily-goal chests)."""
import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.course import _enum_values


class RewardKind(str, enum.Enum):
    UNIT_CHEST = "unit_chest"  # treasure chest placed on the learning path
    DAILY_GOAL = "daily_goal"  # chest for reaching the daily XP goal
    FREE_REFILL = "free_refill"  # one-time free heart refill offered to new learners


class UserReward(Base):
    """One row per reward claimed.

    `key` identifies the reward instance ("unit_chest:3", "daily_goal:2026-11-11").
    The (user_id, key) unique constraint is what makes claiming idempotent: a
    chest can never pay out twice, even with double clicks or retries.
    """

    __tablename__ = "user_rewards"
    __table_args__ = (UniqueConstraint("user_id", "key"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(64))
    kind: Mapped[RewardKind] = mapped_column(
        Enum(RewardKind, values_callable=_enum_values, native_enum=False, length=20)
    )
    gems: Mapped[int] = mapped_column(Integer)
    claimed_at: Mapped[datetime] = mapped_column(DateTime)

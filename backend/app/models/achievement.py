"""Achievements: seeded definitions plus per-user unlocks."""
import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.course import _enum_values


class AchievementMetric(str, enum.Enum):
    """What an achievement's threshold is measured against."""

    TOTAL_XP = "total_xp"
    STREAK = "streak"  # longest streak ever reached
    LESSONS = "lessons"  # completed sessions
    PERFECT_LESSONS = "perfect_lessons"  # completed with zero mistakes
    SKILLS = "skills"  # skills fully completed


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(40), unique=True)
    title: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(200))
    icon: Mapped[str] = mapped_column(String(30))
    color: Mapped[str] = mapped_column(String(20))
    metric: Mapped[AchievementMetric] = mapped_column(
        Enum(AchievementMetric, values_callable=_enum_values, native_enum=False, length=20)
    )
    threshold: Mapped[int] = mapped_column(Integer)
    position: Mapped[int] = mapped_column(Integer, default=0)


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id", ondelete="CASCADE"))
    unlocked_at: Mapped[datetime] = mapped_column(DateTime)

    achievement: Mapped[Achievement] = relationship()

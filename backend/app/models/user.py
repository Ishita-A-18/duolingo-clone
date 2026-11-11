"""Learner state: the user row plus per-user progress tables."""
import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.timeutil import utcnow
from app.db import Base
from app.models.course import _enum_values


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(40), unique=True)
    display_name: Mapped[str] = mapped_column(String(80))
    avatar_color: Mapped[str] = mapped_column(String(20), default="blue")
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    active_course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"), nullable=True)
    # Seeded leaderboard competitors are regular users flagged as bots.
    is_bot: Mapped[bool] = mapped_column(Boolean, default=False)

    # Gamification counters (denormalised for fast reads; ledgers below are the history).
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    gems: Mapped[int] = mapped_column(Integer, default=500)
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    # Anchor for lazy heart regeneration: hearts regen one per interval since this time.
    hearts_updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_streak_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Preferences
    daily_goal_xp: Mapped[int] = mapped_column(Integer, default=20)
    sound_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    animations_enabled: Mapped[bool] = mapped_column(Boolean, default=True)  # confetti + motion
    motivational_messages: Mapped[bool] = mapped_column(Boolean, default=True)  # "Don't give up!" screens
    listening_enabled: Mapped[bool] = mapped_column(Boolean, default=True)  # read prompts aloud

    skill_progress: Mapped[list["SkillProgress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    daily_activity: Mapped[list["DailyActivity"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class DailyActivity(Base):
    """One row per user per local calendar day with any XP earned.

    Drives the daily goal, streak calendar and weekly leaderboard.
    """

    __tablename__ = "daily_activity"
    __table_args__ = (UniqueConstraint("user_id", "date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped[User] = relationship(back_populates="daily_activity")


class SkillProgress(Base):
    """How far a user is through a skill's lessons (drives path ring + lock state)."""

    __tablename__ = "skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    # Crowns: +1 each time the skill is finished (first completion) and each review.
    crowns: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped[User] = relationship(back_populates="skill_progress")


class SessionMode(str, enum.Enum):
    LESSON = "lesson"  # next lesson of an active skill: advances progress
    REVIEW = "review"  # replay a completed skill
    HEART_PRACTICE = "heart_practice"  # no hearts at risk; earns a heart back


class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class LessonSession(Base):
    """A single attempt at a lesson. The server grades every answer in it."""

    __tablename__ = "lesson_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # uuid4
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # Null for heart-practice sessions, which mix exercises from several lessons.
    lesson_id: Mapped[int | None] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"), index=True, nullable=True
    )
    mode: Mapped[SessionMode] = mapped_column(
        Enum(SessionMode, values_callable=_enum_values, native_enum=False, length=20)
    )
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, values_callable=_enum_values, native_enum=False, length=20),
        default=SessionStatus.ACTIVE,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    mistake_count: Mapped[int] = mapped_column(Integer, default=0)
    hearts_lost: Mapped[int] = mapped_column(Integer, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)

    lesson = relationship("Lesson")
    items: Mapped[list["SessionExercise"]] = relationship(
        back_populates="session", order_by="SessionExercise.position", cascade="all, delete-orphan"
    )
    answers: Mapped[list["SessionAnswer"]] = relationship(
        back_populates="session", order_by="SessionAnswer.id", cascade="all, delete-orphan"
    )


class SessionExercise(Base):
    """The exercises dealt into a session, in order.

    Decouples a session from a single lesson: a normal lesson copies its
    lesson's exercises, heart practice samples from everything learned so far.
    """

    __tablename__ = "session_exercises"
    __table_args__ = (UniqueConstraint("session_id", "position"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("lesson_sessions.id", ondelete="CASCADE"), index=True
    )
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)

    session: Mapped[LessonSession] = relationship(back_populates="items")
    exercise = relationship("Exercise")


class SessionAnswer(Base):
    """Audit log of every submitted answer (accuracy stats, completion validation)."""

    __tablename__ = "session_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("lesson_sessions.id", ondelete="CASCADE"), index=True
    )
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"))
    answer: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    answered_at: Mapped[datetime] = mapped_column(DateTime)

    session: Mapped[LessonSession] = relationship(back_populates="answers")

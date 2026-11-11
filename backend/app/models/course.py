"""Course content: Course -> Unit -> Skill -> Lesson -> Exercise -> Option / AcceptedAnswer.

Content is read-only at runtime and fully seeded. Every child table has a
`position` column with a (parent_id, position) unique constraint so ordering
is explicit and stable rather than relying on primary-key order.
"""
import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class ExerciseType(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"  # pick one option (text or picture cards)
    TRANSLATE = "translate"  # build the sentence from a word bank
    MATCH_PAIRS = "match_pairs"  # tap matching left/right pairs
    FILL_BLANK = "fill_blank"  # choose the word that fills "___"
    TYPE_ANSWER = "type_answer"  # free-text typing


def _enum_values(e: type[enum.Enum]) -> list[str]:
    return [m.value for m in e]


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(16), unique=True)  # e.g. "es-en"
    title: Mapped[str] = mapped_column(String(120))
    learning_language: Mapped[str] = mapped_column(String(8))  # ISO 639-1, "es"
    learning_language_name: Mapped[str] = mapped_column(String(40))
    from_language: Mapped[str] = mapped_column(String(8))  # "en"

    units: Mapped[list["Unit"]] = relationship(
        back_populates="course", order_by="Unit.position", cascade="all, delete-orphan"
    )


class Unit(Base):
    __tablename__ = "units"
    __table_args__ = (UniqueConstraint("course_id", "position"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    section: Mapped[int] = mapped_column(Integer, default=1)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(255))
    # Theme key understood by the frontend ("green", "purple", "blue", ...).
    color: Mapped[str] = mapped_column(String(20), default="green")

    course: Mapped[Course] = relationship(back_populates="units")
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="unit", order_by="Skill.position", cascade="all, delete-orphan"
    )


class Skill(Base):
    """A node on the learning path. Contains several lessons."""

    __tablename__ = "skills"
    __table_args__ = (UniqueConstraint("unit_id", "position"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(120))
    icon: Mapped[str] = mapped_column(String(30), default="star")

    unit: Mapped[Unit] = relationship(back_populates="skills")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="skill", order_by="Lesson.position", cascade="all, delete-orphan"
    )


class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = (UniqueConstraint("skill_id", "position"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)

    skill: Mapped[Skill] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(
        back_populates="lesson", order_by="Exercise.position", cascade="all, delete-orphan"
    )


class Exercise(Base):
    __tablename__ = "exercises"
    __table_args__ = (UniqueConstraint("lesson_id", "position"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    type: Mapped[ExerciseType] = mapped_column(
        Enum(ExerciseType, values_callable=_enum_values, native_enum=False, length=20)
    )
    # Heading shown above the exercise, e.g. "Write this in English".
    instruction: Mapped[str] = mapped_column(String(200))
    # Text shown in the mascot speech bubble / the word being asked about.
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Language of `prompt`, used for text-to-speech ("es" / "en").
    prompt_language: Mapped[str | None] = mapped_column(String(8), nullable=True)
    # JSON {"word": "meaning"} for the hover hints on a Spanish prompt
    # (the dotted-underline words in the speech bubble).
    prompt_hints: Mapped[str | None] = mapped_column(Text, nullable=True)
    # For fill_blank: sentence containing "___".
    sentence: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Canonical answer shown in the feedback bar. Null for match_pairs.
    solution: Mapped[str | None] = mapped_column(Text, nullable=True)

    lesson: Mapped[Lesson] = relationship(back_populates="exercises")
    options: Mapped[list["ExerciseOption"]] = relationship(
        back_populates="exercise", order_by="ExerciseOption.position", cascade="all, delete-orphan"
    )
    accepted_answers: Mapped[list["AcceptedAnswer"]] = relationship(
        back_populates="exercise", cascade="all, delete-orphan"
    )


class ExerciseOption(Base):
    """A selectable thing in an exercise.

    multiple_choice / fill_blank: one row per choice, `is_correct` marks the answer.
    translate: one row per word-bank tile; `is_correct` marks tiles in the solution.
    match_pairs: one row per pair; `text` is the left side, `match_text` the right.
    """

    __tablename__ = "exercise_options"

    id: Mapped[int] = mapped_column(primary_key=True)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(String(200))
    match_text: Mapped[str | None] = mapped_column(String(200), nullable=True)
    image: Mapped[str | None] = mapped_column(String(16), nullable=True)  # emoji illustration
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)

    exercise: Mapped[Exercise] = relationship(back_populates="options")


class AcceptedAnswer(Base):
    """Alternative correct answers for translate / type_answer (besides `solution`)."""

    __tablename__ = "accepted_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"), index=True)
    text: Mapped[str] = mapped_column(String(300))

    exercise: Mapped[Exercise] = relationship(back_populates="accepted_answers")

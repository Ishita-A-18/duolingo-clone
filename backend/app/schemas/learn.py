"""Schemas for the learning path and lesson sessions.

Exercise payloads never contain answers: `is_correct` and accepted answers
stay server-side and are only revealed in the feedback after a submission.
The one exception is match_pairs, whose pairings the client needs for instant
per-tap feedback.
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, model_validator

NodeStateT = Literal["completed", "active", "locked"]


class SkillOut(BaseModel):
    id: int
    title: str
    icon: str
    state: NodeStateT
    lessons_completed: int
    total_lessons: int
    crowns: int
    max_crowns: int
    legendary: bool  # passed the skill's Legendary challenge


class ChestOut(BaseModel):
    state: Literal["locked", "available", "claimed"]
    gems: int
    after_skill: int  # 0-based index of the skill the chest follows on the path


class UnitOut(BaseModel):
    id: int
    position: int
    section: int
    title: str
    description: str
    color: str
    state: NodeStateT
    skills: list[SkillOut]
    chest: ChestOut


class LegendaryRulesOut(BaseModel):
    gem_cost: int
    xp: int
    questions: int
    seconds: int
    mistakes_allowed: int


class PathOut(BaseModel):
    course_id: int
    course_title: str
    units: list[UnitOut]
    legendary: LegendaryRulesOut


# ---------------------------------------------------------------- sessions


class OptionOut(BaseModel):
    id: int
    text: str
    image: str | None = None


class PairOut(BaseModel):
    id: int
    left: str
    right: str


class ExerciseOut(BaseModel):
    id: int
    type: str
    instruction: str
    prompt: str | None
    prompt_language: str | None
    sentence: str | None
    hints: dict[str, str]  # word -> meaning for the prompt's hover hints
    options: list[OptionOut]
    pairs: list[PairOut]


class ChestClaimOut(BaseModel):
    gems_earned: int
    gems: int


class StartSessionIn(BaseModel):
    mode: Literal["skill", "heart_practice", "legendary"] = "skill"
    skill_id: int | None = None

    @model_validator(mode="after")
    def _needs_skill(self):
        if self.mode != "heart_practice" and self.skill_id is None:
            raise ValueError("skill_id is required for skill and legendary sessions")
        return self


class SessionOut(BaseModel):
    id: str
    mode: str
    skill_id: int | None
    skill_title: str | None
    lesson_position: int | None
    total_lessons: int | None
    hearts_at_risk: bool
    # Timed sessions (legendary) only; null otherwise.
    time_limit_seconds: int | None = None
    mistakes_allowed: int | None = None
    exercises: list[ExerciseOut]


class AnswerIn(BaseModel):
    exercise_id: int
    option_id: int | None = None  # multiple_choice, fill_blank
    option_ids: list[int] | None = None  # translate tiles (ordered), match_pairs
    text: str | None = None  # type_answer, translate via keyboard
    skipped: bool = False


class AnswerOut(BaseModel):
    correct: bool
    solution: str | None
    note: str | None
    hearts: int
    next_heart_at: datetime | None
    challenge_failed: bool = False  # legendary: too many mistakes, session is over


class StreakOut(BaseModel):
    previous: int
    current: int
    extended_today: bool


class UnlockedAchievementOut(BaseModel):
    key: str
    title: str
    description: str
    icon: str
    color: str


class CompletionOut(BaseModel):
    xp_earned: int
    accuracy: int
    duration_seconds: int
    mistakes: int
    streak: StreakOut
    today_xp: int
    daily_goal_xp: int
    daily_goal_reached_now: bool
    skill_id: int | None
    skill_completed_now: bool
    crowns: int
    unit_completed_now: bool
    heart_gained: bool
    legendary_now: bool
    gems_earned: int
    gems: int
    hearts: int
    total_xp: int
    achievements_unlocked: list[UnlockedAchievementOut]

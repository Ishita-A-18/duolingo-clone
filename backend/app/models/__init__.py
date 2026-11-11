"""Import every model so Base.metadata knows about all tables."""
from app.models.achievement import Achievement, AchievementMetric, UserAchievement
from app.models.course import (
    AcceptedAnswer,
    Course,
    Exercise,
    ExerciseOption,
    ExerciseType,
    Lesson,
    Skill,
    Unit,
)
from app.models.reward import RewardKind, UserReward
from app.models.system import AppSetting
from app.models.user import (
    DailyActivity,
    LessonSession,
    SessionAnswer,
    SessionExercise,
    SessionMode,
    SessionStatus,
    SkillProgress,
    User,
)

__all__ = [
    "AcceptedAnswer",
    "Achievement",
    "AchievementMetric",
    "AppSetting",
    "Course",
    "DailyActivity",
    "Exercise",
    "ExerciseOption",
    "ExerciseType",
    "Lesson",
    "LessonSession",
    "RewardKind",
    "SessionAnswer",
    "SessionExercise",
    "SessionMode",
    "SessionStatus",
    "Skill",
    "SkillProgress",
    "Unit",
    "User",
    "UserAchievement",
    "UserReward",
]

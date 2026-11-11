from datetime import date, datetime

from pydantic import BaseModel, Field


class CourseBrief(BaseModel):
    id: int
    code: str
    title: str
    learning_language: str
    learning_language_name: str


class DayActivity(BaseModel):
    date: date
    xp: int


class MeOut(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: str
    joined_at: datetime
    course: CourseBrief | None

    total_xp: int
    gems: int
    hearts: int
    max_hearts: int
    next_heart_at: datetime | None
    next_heart_in_seconds: int | None
    heart_refill_cost: int
    free_refill_available: bool  # one-time free refill not yet used

    streak: int
    longest_streak: int
    streak_extended_today: bool
    week: list[DayActivity]

    daily_goal_xp: int
    today_xp: int
    sound_enabled: bool
    animations_enabled: bool
    motivational_messages: bool
    listening_enabled: bool


class SettingsIn(BaseModel):
    display_name: str | None = Field(default=None, max_length=40)
    daily_goal_xp: int | None = None
    sound_enabled: bool | None = None
    animations_enabled: bool | None = None
    motivational_messages: bool | None = None
    listening_enabled: bool | None = None
    # IANA name, e.g. "Asia/Kolkata". The client sends the browser's zone so
    # "today" (streaks, daily goal) matches the learner's own calendar.
    timezone: str | None = Field(default=None, max_length=64)


class AchievementOut(BaseModel):
    metric: str
    title: str
    icon: str
    color: str
    level: int
    max_level: int
    value: int
    next_threshold: int | None
    description: str


class ProfileOut(BaseModel):
    me: MeOut
    lessons_completed: int
    crowns: int
    skills_completed: int
    total_skills: int
    league: str | None  # None until leagues unlock
    league_rank: int | None
    top3_finishes: int  # finished weeks ending in 1st-3rd place
    achievements: list[AchievementOut]


class StandingOut(BaseModel):
    rank: int
    user_id: int
    display_name: str
    avatar_color: str
    weekly_xp: int
    is_me: bool


class LeaderboardOut(BaseModel):
    league: str
    week_start: date
    days_left: int
    promotion_zone: int
    unlocked: bool  # leagues unlock after a few completed lessons
    lessons_to_unlock: int
    standings: list[StandingOut]  # empty while locked

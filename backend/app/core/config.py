"""Application settings, loaded from environment variables (or a .env file).

Every gameplay constant lives here so it can be tuned without touching code,
e.g. shortening heart regeneration for a demo.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Duolingo Clone API"
    database_url: str = "sqlite:///./duolingo.db"
    # Comma separated list of allowed frontend origins.
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    # Optional regex for hosted frontends, e.g. "https://.*\.vercel\.app" so
    # every Vercel deployment (production and previews) can call the API.
    cors_origin_regex: str | None = None

    # The "logged in" learner. Auth is simplified per the assignment.
    default_username: str = "alex"
    default_timezone: str = "UTC"

    # Hearts
    max_hearts: int = 5
    heart_regen_minutes: int = 60  # Duolingo uses hours; shortened for demos.
    heart_refill_gem_cost: int = 350

    # XP
    lesson_xp: int = 10
    perfect_lesson_bonus_xp: int = 5
    review_xp: int = 5
    heart_practice_xp: int = 5

    # Leagues open after this many completed lessons (new learners see a teaser).
    league_unlock_lessons: int = 10  # matches the original ("completing 10 lessons")

    # Gem rewards
    unit_chest_gems: int = 15
    daily_goal_gems: int = 5

    # Seeds the database on startup if it is empty.
    seed_on_startup: bool = True
    # Exposes /api/dev/* (clock simulation, reset). Disable in real prod.
    enable_dev_tools: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

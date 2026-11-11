"""Hearts: lose one per mistake, regenerate lazily over time, refill with gems.

Regeneration is computed on read instead of by a background job: the user row
stores `hearts` plus `hearts_updated_at`, the moment the regen countdown last
started. Whenever we touch a user we "sync" by adding one heart per elapsed
interval. This is cheap, exact and needs no scheduler.
"""
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.errors import ConflictError
from app.models import User


def _interval() -> timedelta:
    return timedelta(minutes=settings.heart_regen_minutes)


def sync_hearts(user: User, now: datetime) -> None:
    """Apply any regeneration earned since `hearts_updated_at`."""
    if user.hearts_updated_at > now:
        # Clock moved backwards (dev time-travel reset); restart the countdown.
        user.hearts_updated_at = now
    if user.hearts >= settings.max_hearts:
        user.hearts = settings.max_hearts
        user.hearts_updated_at = now
        return
    gained = int((now - user.hearts_updated_at) / _interval())
    if gained <= 0:
        return
    user.hearts = min(settings.max_hearts, user.hearts + gained)
    if user.hearts >= settings.max_hearts:
        user.hearts_updated_at = now
    else:
        # Keep the partial progress towards the next heart.
        user.hearts_updated_at += _interval() * gained


def next_heart_at(user: User) -> datetime | None:
    if user.hearts >= settings.max_hearts:
        return None
    return user.hearts_updated_at + _interval()


def lose_heart(user: User, now: datetime) -> None:
    sync_hearts(user, now)
    if user.hearts <= 0:
        return
    if user.hearts >= settings.max_hearts:
        user.hearts_updated_at = now  # countdown starts with the first lost heart
    user.hearts -= 1


def gain_heart(user: User, now: datetime) -> None:
    sync_hearts(user, now)
    user.hearts = min(settings.max_hearts, user.hearts + 1)
    if user.hearts >= settings.max_hearts:
        user.hearts_updated_at = now


def refill_with_gems(user: User, now: datetime) -> None:
    sync_hearts(user, now)
    if user.hearts >= settings.max_hearts:
        raise ConflictError("Your hearts are already full.", code="hearts_full")
    if user.gems < settings.heart_refill_gem_cost:
        raise ConflictError("Not enough gems.", code="not_enough_gems")
    user.gems -= settings.heart_refill_gem_cost
    user.hearts = settings.max_hearts
    user.hearts_updated_at = now

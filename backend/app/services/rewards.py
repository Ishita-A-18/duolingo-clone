"""Gem rewards: treasure chests on the path and the daily-goal chest.

Each unit has one chest sitting after its first CHEST_AFTER_SKILLS skills.
The chest opens (state "available") once those skills are completed and can be
claimed exactly once. Reaching the daily XP goal grants a smaller chest
automatically, at most once per local day.
"""
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import Clock
from app.core.config import settings
from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.models import RewardKind, User, UserReward
from app.services import hearts, path

CHEST_AFTER_SKILLS = 2


FREE_REFILL_KEY = "free_refill"


def unit_chest_key(unit_id: int) -> str:
    return f"unit_chest:{unit_id}"


def daily_goal_key(day: date) -> str:
    return f"daily_goal:{day.isoformat()}"


def claimed_keys(db: Session, user_id: int) -> set[str]:
    return set(db.scalars(select(UserReward.key).where(UserReward.user_id == user_id)))


def grant(db: Session, user: User, key: str, kind: RewardKind, gems: int, now: datetime) -> bool:
    """Pay out a reward once. Returns False if it was already claimed."""
    exists = db.scalar(
        select(UserReward.id).where(UserReward.user_id == user.id, UserReward.key == key)
    )
    if exists:
        return False
    db.add(UserReward(user_id=user.id, key=key, kind=kind, gems=gems, claimed_at=now))
    user.gems += gems
    return True


def chest_after(unit: path.UnitNode) -> int:
    """Index of the skill the chest follows on the path (0-based)."""
    return min(CHEST_AFTER_SKILLS, len(unit.skills)) - 1


def chest_state(unit: path.UnitNode, claimed: set[str]) -> str:
    if unit_chest_key(unit.unit.id) in claimed:
        return "claimed"
    gating = unit.skills[: chest_after(unit) + 1]
    if gating and all(n.state == path.NodeState.COMPLETED for n in gating):
        return "available"
    return "locked"


def claim_unit_chest(db: Session, user: User, unit_id: int, clock: Clock) -> int:
    _, units = path.build_path(db, user)
    unit = next((u for u in units if u.unit.id == unit_id), None)
    if unit is None:
        raise NotFoundError("Unit not found in your course.")
    state = chest_state(unit, claimed_keys(db, user.id))
    if state == "locked":
        raise ForbiddenError("Complete the levels above to open this chest.", code="chest_locked")
    if state == "claimed":
        raise ConflictError("You already opened this chest.", code="chest_claimed")
    grant(db, user, unit_chest_key(unit_id), RewardKind.UNIT_CHEST, settings.unit_chest_gems, clock.now())
    db.commit()
    return settings.unit_chest_gems


def free_refill_available(db: Session, user: User) -> bool:
    return FREE_REFILL_KEY not in claimed_keys(db, user.id)


def refill_hearts_free(db: Session, user: User, now: datetime) -> None:
    """The original offers a one-time free refill the first time you run out."""
    hearts.sync_hearts(user, now)
    if user.hearts >= settings.max_hearts:
        raise ConflictError("Your hearts are already full.", code="hearts_full")
    if not grant(db, user, FREE_REFILL_KEY, RewardKind.FREE_REFILL, 0, now):
        raise ConflictError("You've already used your free refill.", code="free_refill_used")
    user.hearts = settings.max_hearts
    user.hearts_updated_at = now

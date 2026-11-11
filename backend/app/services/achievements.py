"""Achievements are tiered: each row is one tier (threshold) of a metric.

Tiers that share a metric form a family, so the profile can show
"On Fire - Level 2 of 4" with a progress bar towards the next tier.
"""
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Achievement,
    AchievementMetric,
    LessonSession,
    SessionStatus,
    SkillProgress,
    User,
    UserAchievement,
)


def metric_values(db: Session, user: User) -> dict[AchievementMetric, int]:
    completed = (
        select(func.count())
        .select_from(LessonSession)
        .where(LessonSession.user_id == user.id, LessonSession.status == SessionStatus.COMPLETED)
    )
    perfect = completed.where(LessonSession.mistake_count == 0)
    skills = (
        select(func.count())
        .select_from(SkillProgress)
        .where(SkillProgress.user_id == user.id, SkillProgress.completed_at.is_not(None))
    )
    return {
        AchievementMetric.TOTAL_XP: user.total_xp,
        AchievementMetric.STREAK: user.longest_streak,
        AchievementMetric.LESSONS: db.scalar(completed) or 0,
        AchievementMetric.PERFECT_LESSONS: db.scalar(perfect) or 0,
        AchievementMetric.SKILLS: db.scalar(skills) or 0,
    }


def _owned_ids(db: Session, user_id: int) -> set[int]:
    return set(
        db.scalars(select(UserAchievement.achievement_id).where(UserAchievement.user_id == user_id))
    )


def _all_tiers(db: Session) -> list[Achievement]:
    return list(db.scalars(select(Achievement).order_by(Achievement.position, Achievement.threshold)))


def evaluate(db: Session, user: User, now: datetime) -> list[Achievement]:
    """Unlock every tier the user now qualifies for; return the new ones."""
    values = metric_values(db, user)
    owned = _owned_ids(db, user.id)
    unlocked = []
    for a in _all_tiers(db):
        if a.id not in owned and values[a.metric] >= a.threshold:
            db.add(UserAchievement(user_id=user.id, achievement_id=a.id, unlocked_at=now))
            unlocked.append(a)
    return unlocked


@dataclass
class AchievementFamily:
    metric: AchievementMetric
    title: str
    icon: str
    color: str
    level: int  # tiers unlocked
    max_level: int
    value: int
    next_threshold: int | None
    description: str  # describes the next tier (or the last one when maxed)


def families(db: Session, user: User) -> list[AchievementFamily]:
    values = metric_values(db, user)
    owned = _owned_ids(db, user.id)
    grouped: dict[AchievementMetric, list[Achievement]] = defaultdict(list)
    for a in _all_tiers(db):
        grouped[a.metric].append(a)

    result = []
    for metric, tiers in grouped.items():
        level = sum(1 for t in tiers if t.id in owned)
        nxt = next((t for t in tiers if t.id not in owned), None)
        shown = nxt or tiers[-1]
        result.append(
            AchievementFamily(
                metric=metric,
                title=tiers[0].title,
                icon=tiers[0].icon,
                color=tiers[0].color,
                level=level,
                max_level=len(tiers),
                value=values[metric],
                next_threshold=nxt.threshold if nxt else None,
                description=shown.description,
            )
        )
    return result

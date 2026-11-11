"""The learning path: which skills are completed, active or locked.

Progression is strictly linear across the whole course, as on Duolingo's path:
every skill before the first unfinished one is completed, that unfinished
skill is the single "active" node, and everything after it is locked.
"""
from dataclasses import dataclass
from enum import Enum

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import NotFoundError
from app.models import Course, Skill, SkillProgress, Unit, User


class NodeState(str, Enum):
    COMPLETED = "completed"
    ACTIVE = "active"
    LOCKED = "locked"


@dataclass
class SkillNode:
    skill: Skill
    state: NodeState
    lessons_completed: int
    total_lessons: int
    crowns: int


@dataclass
class UnitNode:
    unit: Unit
    state: NodeState
    skills: list[SkillNode]


def load_course(db: Session, course_id: int) -> Course:
    course = db.scalar(
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.units).selectinload(Unit.skills).selectinload(Skill.lessons))
    )
    if course is None:
        raise NotFoundError("Course not found.")
    return course


def progress_map(db: Session, user_id: int) -> dict[int, SkillProgress]:
    rows = db.scalars(select(SkillProgress).where(SkillProgress.user_id == user_id)).all()
    return {r.skill_id: r for r in rows}


def build_path(db: Session, user: User) -> tuple[Course, list[UnitNode]]:
    if user.active_course_id is None:
        raise NotFoundError("No active course.")
    course = load_course(db, user.active_course_id)
    progress = progress_map(db, user.id)

    found_active = False
    units: list[UnitNode] = []
    for unit in course.units:
        nodes: list[SkillNode] = []
        for skill in unit.skills:
            p = progress.get(skill.id)
            done = p.lessons_completed if p else 0
            total = len(skill.lessons)
            if p is not None and p.completed_at is not None:
                state = NodeState.COMPLETED
            elif not found_active:
                state, found_active = NodeState.ACTIVE, True
            else:
                state = NodeState.LOCKED
            nodes.append(SkillNode(skill, state, min(done, total), total, p.crowns if p else 0))

        states = {n.state for n in nodes}
        if states == {NodeState.COMPLETED}:
            unit_state = NodeState.COMPLETED
        elif NodeState.ACTIVE in states or NodeState.COMPLETED in states:
            unit_state = NodeState.ACTIVE
        else:
            unit_state = NodeState.LOCKED
        units.append(UnitNode(unit, unit_state, nodes))
    return course, units


def find_node(units: list[UnitNode], skill_id: int) -> SkillNode:
    for u in units:
        for n in u.skills:
            if n.skill.id == skill_id:
                return n
    raise NotFoundError("Skill not found in your course.")

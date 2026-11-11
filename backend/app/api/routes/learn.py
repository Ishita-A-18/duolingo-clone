from fastapi import APIRouter, status

from app.api import serializers as ser
from app.api.deps import DB, CurrentClock, CurrentUser
from app.schemas.learn import (
    AnswerIn,
    AnswerOut,
    ChestClaimOut,
    CompletionOut,
    PathOut,
    SessionOut,
    StartSessionIn,
)
from app.services import path, rewards, sessions
from app.services.grading import AnswerInput

router = APIRouter(tags=["learn"])


@router.get("/path", response_model=PathOut, summary="Units and skills with lock/progress state")
def get_path(db: DB, user: CurrentUser):
    course, units = path.build_path(db, user)
    return ser.path_out(course, units, rewards.claimed_keys(db, user.id))


@router.post(
    "/path/units/{unit_id}/chest",
    response_model=ChestClaimOut,
    summary="Open a unit's treasure chest (once its gating skills are complete)",
)
def claim_chest(unit_id: int, db: DB, user: CurrentUser, clock: CurrentClock):
    gems = rewards.claim_unit_chest(db, user, unit_id, clock)
    return ChestClaimOut(gems_earned=gems, gems=user.gems)


@router.post(
    "/sessions",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Start a lesson (next lesson of a skill, a review, or heart practice)",
)
def start_session(body: StartSessionIn, db: DB, user: CurrentUser, clock: CurrentClock):
    if body.mode == "heart_practice":
        s = sessions.start_heart_practice(db, user, clock)
    else:
        s = sessions.start_skill_session(db, user, body.skill_id, clock)
    return ser.session_out(s, sessions.dealt_exercises(db, s))


@router.post("/sessions/{session_id}/answers", response_model=AnswerOut, summary="Grade one answer")
def submit_answer(session_id: str, body: AnswerIn, db: DB, user: CurrentUser, clock: CurrentClock):
    outcome = sessions.answer(
        db, user, session_id, body.exercise_id,
        AnswerInput(
            option_id=body.option_id, option_ids=body.option_ids, text=body.text, skipped=body.skipped
        ),
        clock,
    )
    return AnswerOut(
        correct=outcome.result.correct,
        solution=outcome.result.solution,
        note=outcome.result.note,
        hearts=outcome.hearts,
        next_heart_at=outcome.next_heart_at,
    )


@router.post(
    "/sessions/{session_id}/complete",
    response_model=CompletionOut,
    summary="Finish a session: award XP, advance progress, extend the streak",
)
def complete_session(session_id: str, db: DB, user: CurrentUser, clock: CurrentClock):
    result = sessions.complete(db, user, session_id, clock)
    return ser.completion_out(result, user)


@router.post(
    "/sessions/{session_id}/abandon",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Quit a session (closing the lesson or running out of hearts)",
)
def abandon_session(session_id: str, db: DB, user: CurrentUser):
    sessions.abandon(db, user, session_id)

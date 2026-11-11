"""Developer tools for testing time-based mechanics in the running app.

Only mounted when ENABLE_DEV_TOOLS is true.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps import DB, CurrentClock
from app.core.clock import get_offset_days, load_clock, set_offset_days
from app.seed.run import reset_database

router = APIRouter(prefix="/dev", tags=["dev tools"])


class ClockOut(BaseModel):
    offset_days: int
    now: str


class ClockIn(BaseModel):
    offset_days: int = Field(ge=0, le=3650)


@router.get("/clock", response_model=ClockOut, summary="Current simulated time")
def get_clock(clock: CurrentClock):
    return ClockOut(offset_days=clock.offset_days, now=clock.now().isoformat())


@router.put("/clock", response_model=ClockOut, summary="Set the simulated day offset")
def put_clock(body: ClockIn, db: DB):
    set_offset_days(db, body.offset_days)
    return get_clock(_clock_from(db))


@router.post("/clock/advance", response_model=ClockOut, summary="Jump forward one day")
def advance_clock(db: DB):
    set_offset_days(db, get_offset_days(db) + 1)
    return get_clock(_clock_from(db))


@router.post("/reset", status_code=204, summary="Wipe and reseed the database")
def reset(db: DB):
    db.close()
    reset_database()


def _clock_from(db):
    return load_clock(db)

import os
import tempfile

# Point the app at a throwaway database *before* app modules are imported.
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["SEED_ON_STARTUP"] = "true"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import select  # noqa: E402
from sqlalchemy.orm import selectinload  # noqa: E402

from app.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Exercise, ExerciseType  # noqa: E402
from app.seed.generator import tiles  # noqa: E402
from app.seed.run import reset_database  # noqa: E402


@pytest.fixture()
def client():
    reset_database()
    with TestClient(app) as c:
        yield c


def correct_answer(exercise_id: int) -> dict:
    """Build a correct submission by peeking at the answer key in the DB."""
    with SessionLocal() as db:
        e = db.scalar(
            select(Exercise).where(Exercise.id == exercise_id).options(selectinload(Exercise.options))
        )
        if e.type in (ExerciseType.MULTIPLE_CHOICE, ExerciseType.FILL_BLANK):
            return {"option_id": next(o.id for o in e.options if o.is_correct)}
        if e.type == ExerciseType.TRANSLATE:
            remaining = [o for o in e.options if o.is_correct]
            ordered = []
            for word in tiles(e.solution):
                tile = next(o for o in remaining if o.text == word)
                remaining.remove(tile)
                ordered.append(tile.id)
            return {"option_ids": ordered}
        if e.type == ExerciseType.MATCH_PAIRS:
            return {"option_ids": [o.id for o in e.options]}
        return {"text": e.solution}


def wrong_answer(exercise: dict) -> dict:
    if exercise["type"] in ("multiple_choice", "fill_blank"):
        with SessionLocal() as db:
            e = db.scalar(
                select(Exercise)
                .where(Exercise.id == exercise["id"])
                .options(selectinload(Exercise.options))
            )
            return {"option_id": next(o.id for o in e.options if not o.is_correct)}
    if exercise["type"] == "match_pairs":
        return {"option_ids": []}
    return {"text": "definitely wrong"}


def play_session(client, session: dict) -> dict:
    """Answer every exercise correctly and complete the session."""
    for ex in session["exercises"]:
        r = client.post(
            f"/api/sessions/{session['id']}/answers",
            json={"exercise_id": ex["id"], **correct_answer(ex["id"])},
        )
        assert r.status_code == 200, r.text
        assert r.json()["correct"], (ex, r.json())
    r = client.post(f"/api/sessions/{session['id']}/complete")
    assert r.status_code == 200, r.text
    return r.json()

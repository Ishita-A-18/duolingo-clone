"""Legendary challenge: a timed, gem-priced test over a completed skill."""
from tests.conftest import correct_answer, play_session, wrong_answer


def _skills(client):
    return [s for u in client.get("/api/path").json()["units"] for s in u["skills"]]


def _completed_skill(client):
    return next(s for s in _skills(client) if s["state"] == "completed")


def _start(client, skill_id):
    return client.post("/api/sessions", json={"mode": "legendary", "skill_id": skill_id})


def test_only_completed_skills_have_a_legendary_challenge(client):
    active = next(s for s in _skills(client) if s["state"] == "active")
    r = _start(client, active["id"])
    assert r.status_code == 403 and r.json()["error"]["code"] == "skill_not_completed"


def test_starting_costs_gems_and_deals_a_timed_session(client):
    gems = client.get("/api/me").json()["gems"]
    rules = client.get("/api/path").json()["legendary"]
    session = _start(client, _completed_skill(client)["id"]).json()

    assert client.get("/api/me").json()["gems"] == gems - rules["gem_cost"]
    assert session["mode"] == "legendary" and session["hearts_at_risk"] is False
    assert session["time_limit_seconds"] == rules["seconds"]
    assert session["mistakes_allowed"] == rules["mistakes_allowed"]
    assert len(session["exercises"]) == rules["questions"]


def test_passing_awards_xp_and_marks_the_skill_legendary(client):
    skill = _completed_skill(client)
    result = play_session(client, _start(client, skill["id"]).json())
    assert result["legendary_now"] is True and result["xp_earned"] == 40
    updated = next(s for s in _skills(client) if s["id"] == skill["id"])
    assert updated["legendary"] is True and updated["crowns"] == updated["max_crowns"]


def test_mistakes_beyond_the_allowance_fail_the_challenge(client):
    session = _start(client, _completed_skill(client)["id"]).json()
    hearts = client.get("/api/me").json()["hearts"]
    ex = next(e for e in session["exercises"] if e["type"] != "match_pairs")
    url = f"/api/sessions/{session['id']}/answers"

    outcomes = [client.post(url, json={"exercise_id": ex["id"], **wrong_answer(ex)}).json() for _ in range(3)]
    assert [o["challenge_failed"] for o in outcomes] == [False, False, True]
    assert client.get("/api/me").json()["hearts"] == hearts  # hearts are never at risk here

    after = client.post(url, json={"exercise_id": ex["id"], **correct_answer(ex["id"])})
    assert after.status_code == 409 and after.json()["error"]["code"] == "session_closed"


def test_answers_after_the_deadline_are_rejected(client):
    session = _start(client, _completed_skill(client)["id"]).json()
    client.put("/api/dev/clock", json={"offset_days": 1})  # jump far past the 3-minute limit
    ex = session["exercises"][0]
    r = client.post(f"/api/sessions/{session['id']}/answers", json={"exercise_id": ex["id"], **correct_answer(ex["id"])})
    assert r.status_code == 409 and r.json()["error"]["code"] == "time_up"


def test_not_enough_gems(client):
    skill_id = _completed_skill(client)["id"]
    while client.get("/api/me").json()["gems"] >= 100:
        assert _start(client, skill_id).status_code == 201
    r = _start(client, skill_id)
    assert r.status_code == 409 and r.json()["error"]["code"] == "not_enough_gems"

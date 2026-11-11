"""End-to-end API tests against a freshly seeded database."""
from tests.conftest import correct_answer, play_session, wrong_answer


def _path(client):
    return client.get("/api/path").json()


def _skills(client):
    return [s for u in _path(client)["units"] for s in u["skills"]]


def _active_skill(client):
    return next(s for s in _skills(client) if s["state"] == "active")


def _start(client, skill_id):
    r = client.post("/api/sessions", json={"skill_id": skill_id})
    assert r.status_code == 201, r.text
    return r.json()


def test_seeded_learner_is_usable_immediately(client):
    me = client.get("/api/me").json()
    assert me["display_name"] == "Alex"
    assert me["streak"] == 4 and not me["streak_extended_today"]
    assert me["hearts"] == 4 and me["gems"] > 0
    states = [s["state"] for s in _skills(client)]
    assert states[:3] == ["completed", "completed", "active"]
    assert set(states[3:]) == {"locked"}


def test_exercises_cover_all_types_and_hide_answers(client):
    session = _start(client, _active_skill(client)["id"])
    types = {e["type"] for e in session["exercises"]}
    assert types == {"multiple_choice", "translate", "match_pairs", "fill_blank", "type_answer"}
    assert "is_correct" not in str(session)


def test_completing_a_lesson_awards_xp_advances_skill_and_extends_streak(client):
    before = client.get("/api/me").json()
    skill = _active_skill(client)
    result = play_session(client, _start(client, skill["id"]))

    assert result["xp_earned"] == 15  # 10 + perfect bonus
    assert result["accuracy"] == 100
    assert result["streak"] == {"previous": 4, "current": 5, "extended_today": True}
    me = client.get("/api/me").json()
    assert me["total_xp"] == before["total_xp"] + 15
    assert me["today_xp"] == 15
    updated = next(s for s in _skills(client) if s["id"] == skill["id"])
    assert updated["lessons_completed"] == skill["lessons_completed"] + 1


def test_streak_only_extends_once_per_day(client):
    skill = _active_skill(client)
    play_session(client, _start(client, skill["id"]))
    second = play_session(client, _start(client, skill["id"]))
    assert second["streak"]["extended_today"] is False
    assert second["streak"]["current"] == 5


def test_finishing_all_lessons_completes_skill_and_unlocks_next(client):
    skill = _active_skill(client)
    for _ in range(skill["total_lessons"] - skill["lessons_completed"]):
        result = play_session(client, _start(client, skill["id"]))
    assert result["skill_completed_now"] and result["crowns"] == 1
    assert result["unit_completed_now"]  # it was the last skill of unit 1
    skills = _skills(client)
    idx = next(i for i, s in enumerate(skills) if s["id"] == skill["id"])
    assert skills[idx]["state"] == "completed"
    assert skills[idx + 1]["state"] == "active"


def test_skipping_counts_as_a_mistake_and_reveals_the_solution(client):
    session = _start(client, _active_skill(client)["id"])
    ex = session["exercises"][0]
    body = client.post(f"/api/sessions/{session['id']}/answers",
                       json={"exercise_id": ex["id"], "skipped": True}).json()
    assert body["correct"] is False and body["solution"] and body["hearts"] == 3


def test_locked_skill_cannot_be_started(client):
    locked = next(s for s in _skills(client) if s["state"] == "locked")
    r = client.post("/api/sessions", json={"skill_id": locked["id"]})
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "skill_locked"


def test_wrong_answer_costs_a_heart_and_must_be_retried(client):
    session = _start(client, _active_skill(client)["id"])
    ex = session["exercises"][0]
    r = client.post(f"/api/sessions/{session['id']}/answers", json={"exercise_id": ex["id"], **wrong_answer(ex)})
    body = r.json()
    assert body["correct"] is False and body["hearts"] == 3 and body["solution"]
    assert body["next_heart_at"] is not None

    # Completing without fixing the mistake is refused.
    assert client.post(f"/api/sessions/{session['id']}/complete").status_code == 409

    result = play_session(client, session)  # answers everything correctly, incl. the retry
    assert result["xp_earned"] == 10 and result["accuracy"] < 100


def test_running_out_of_hearts_blocks_lessons_until_refill(client):
    session = _start(client, _active_skill(client)["id"])
    choice = next(e for e in session["exercises"] if e["type"] == "multiple_choice")
    for _ in range(4):
        client.post(f"/api/sessions/{session['id']}/answers",
                    json={"exercise_id": choice["id"], **wrong_answer(choice)})
    r = client.post(f"/api/sessions/{session['id']}/answers",
                    json={"exercise_id": choice["id"], **correct_answer(choice["id"])})
    assert r.status_code == 409 and r.json()["error"]["code"] == "out_of_hearts"
    assert client.post("/api/sessions", json={"skill_id": _active_skill(client)["id"]}).status_code == 409

    me = client.post("/api/me/hearts/refill").json()
    assert me["hearts"] == me["max_hearts"]
    assert me["gems"] == 520 - me["heart_refill_cost"]
    # Back in business: the same session can continue.
    assert client.post(f"/api/sessions/{session['id']}/answers",
                       json={"exercise_id": choice["id"], **correct_answer(choice["id"])}).json()["correct"]


def test_heart_practice_risks_nothing_and_earns_a_heart(client):
    r = client.post("/api/sessions", json={"mode": "heart_practice"})
    session = r.json()
    assert session["hearts_at_risk"] is False
    ex = session["exercises"][0]
    wrong = client.post(f"/api/sessions/{session['id']}/answers",
                        json={"exercise_id": ex["id"], **wrong_answer(ex)}).json()
    assert wrong["hearts"] == 4  # unchanged
    result = play_session(client, session)
    assert result["heart_gained"] and result["hearts"] == 5


def test_reviewing_a_completed_skill_adds_a_crown(client):
    done = next(s for s in _skills(client) if s["state"] == "completed")
    session = _start(client, done["id"])
    assert session["mode"] == "review"
    assert play_session(client, session)["crowns"] == done["crowns"] + 1


def test_streak_breaks_after_a_missed_day_and_restarts(client):
    client.put("/api/dev/clock", json={"offset_days": 2})
    assert client.get("/api/me").json()["streak"] == 0
    result = play_session(client, _start(client, _active_skill(client)["id"]))
    assert result["streak"]["current"] == 1


def test_simulated_tomorrow_keeps_streak_alive(client):
    play_session(client, _start(client, _active_skill(client)["id"]))  # streak -> 5 today
    client.post("/api/dev/clock/advance")
    me = client.get("/api/me").json()
    assert me["streak"] == 5 and not me["streak_extended_today"] and me["today_xp"] == 0
    assert play_session(client, _start(client, _active_skill(client)["id"]))["streak"]["current"] == 6


def test_daily_goal_reached_flag(client):
    client.patch("/api/me", json={"daily_goal_xp": 10})
    result = play_session(client, _start(client, _active_skill(client)["id"]))
    assert result["daily_goal_reached_now"] is True


def test_settings_validation(client):
    assert client.patch("/api/me", json={"daily_goal_xp": 7}).status_code == 400
    assert client.patch("/api/me", json={"timezone": "Mars/Base"}).status_code == 400
    assert client.patch("/api/me", json={"timezone": "Asia/Kolkata"}).status_code == 200


def test_leaderboard_ranks_by_weekly_xp_and_marks_me(client):
    board = client.get("/api/leaderboard").json()
    xps = [s["weekly_xp"] for s in board["standings"]]
    assert xps == sorted(xps, reverse=True)
    assert sum(s["is_me"] for s in board["standings"]) == 1


def test_profile_has_stats_and_achievements(client):
    profile = client.get("/api/me/profile").json()
    assert profile["me"]["streak"] == 4
    assert profile["skills_completed"] == 2 and profile["total_skills"] == 9
    fire = next(a for a in profile["achievements"] if a["metric"] == "streak")
    assert fire["level"] == 1 and fire["next_threshold"] == 7


def test_new_achievements_are_reported_on_completion(client):
    # Seeded learner: 10 sessions done, 2 skills complete, skill 3 needs 2 more lessons.
    unlocked = set()
    for _ in range(3):
        result = play_session(client, _start(client, _active_skill(client)["id"]))
        unlocked |= {a["key"] for a in result["achievements_unlocked"]}
    assert "skills_3" in unlocked
    # Already-owned tiers are never reported again.
    assert not {"lessons_5", "lessons_10", "streak_3"} & unlocked


def _unit(client, position):
    return next(u for u in _path(client)["units"] if u["position"] == position)


def test_unit_chest_opens_after_gating_skills_and_pays_once(client):
    unit1, unit2 = _unit(client, 1), _unit(client, 2)
    assert unit1["chest"]["state"] == "available"  # seeded learner finished skills 1-2
    assert unit2["chest"]["state"] == "locked"

    gems = client.get("/api/me").json()["gems"]
    r = client.post(f"/api/path/units/{unit1['id']}/chest")
    assert r.status_code == 200 and r.json()["gems"] == gems + r.json()["gems_earned"]
    assert _unit(client, 1)["chest"]["state"] == "claimed"

    again = client.post(f"/api/path/units/{unit1['id']}/chest")
    assert again.status_code == 409 and again.json()["error"]["code"] == "chest_claimed"
    locked = client.post(f"/api/path/units/{unit2['id']}/chest")
    assert locked.status_code == 403 and locked.json()["error"]["code"] == "chest_locked"


def test_daily_goal_pays_gems_once_per_day(client):
    client.patch("/api/me", json={"daily_goal_xp": 10})
    gems = client.get("/api/me").json()["gems"]
    first = play_session(client, _start(client, _active_skill(client)["id"]))
    assert first["daily_goal_reached_now"] and first["gems_earned"] == 5
    assert first["gems"] == gems + 5
    second = play_session(client, _start(client, _active_skill(client)["id"]))
    assert second["gems_earned"] == 0


def test_picture_choice_has_three_cards(client):
    session = _start(client, _active_skill(client)["id"])
    pictures = [e for e in session["exercises"] if e["options"] and all(o["image"] for o in e["options"])]
    assert pictures and all(len(e["options"]) == 3 for e in pictures)


def test_leaderboard_is_locked_for_new_learners(client):
    from app.db import SessionLocal
    from app.models import User
    from sqlalchemy import select

    with SessionLocal() as db:  # a fresh, non-bot learner with no lessons
        newbie = User(username="newbie", display_name="Newbie", is_bot=False,
                      active_course_id=db.scalar(select(User.active_course_id).where(User.username == "alex")))
        db.add(newbie)
        db.commit()
        newbie_id = newbie.id

    board = client.get("/api/leaderboard", headers={"X-User-Id": str(newbie_id)}).json()
    assert board["unlocked"] is False and board["lessons_to_unlock"] == 10 and board["standings"] == []

    seeded = client.get("/api/leaderboard").json()  # Alex has finished lessons already
    assert seeded["unlocked"] is True
    assert all(s["user_id"] != newbie_id for s in seeded["standings"])  # locked learners don't compete


def test_every_spanish_prompt_word_has_a_hover_hint():
    """Content check: the glossary covers every word shown in a Spanish prompt."""
    import json

    from sqlalchemy import select

    from app.db import SessionLocal
    from app.models import Exercise
    from app.seed.generator import tiles
    from app.seed.run import reset_database

    reset_database()
    with SessionLocal() as db:
        prompts = db.scalars(select(Exercise).where(Exercise.prompt_hints.is_not(None))).all()
        assert prompts
        missing = {t for e in prompts for t in tiles(e.prompt) if t.lower() not in json.loads(e.prompt_hints)}
    assert not missing, f"no hint for: {sorted(missing)}"


def test_free_refill_works_once(client):
    session = _start(client, _active_skill(client)["id"])
    ex = next(e for e in session["exercises"] if e["type"] == "type_answer")
    client.post(f"/api/sessions/{session['id']}/answers", json={"exercise_id": ex["id"], "text": "nope"})
    assert client.get("/api/me").json()["free_refill_available"] is True

    me = client.post("/api/me/hearts/refill", json={"free": True}).json()
    assert me["hearts"] == me["max_hearts"] and me["gems"] == 520 and me["free_refill_available"] is False

    client.post(f"/api/sessions/{session['id']}/answers", json={"exercise_id": ex["id"], "text": "nope"})
    again = client.post("/api/me/hearts/refill", json={"free": True})
    assert again.status_code == 409 and again.json()["error"]["code"] == "free_refill_used"


def test_lesson_preferences_persist(client):
    me = client.get("/api/me").json()
    assert me["animations_enabled"] and me["motivational_messages"] and me["listening_enabled"]
    client.patch("/api/me", json={"animations_enabled": False, "listening_enabled": False})
    me = client.get("/api/me").json()
    assert me["animations_enabled"] is False and me["listening_enabled"] is False
    assert me["motivational_messages"] is True  # untouched fields keep their value


def test_top3_finishes_come_from_past_weekly_rankings(client):
    from datetime import date, timedelta

    from sqlalchemy import select

    from app.db import SessionLocal
    from app.models import DailyActivity, User
    from app.services.leaderboard import week_start

    before = client.get("/api/me/profile").json()["top3_finishes"]
    # Win a past week outright (three weeks ago, outside the seeded data).
    with SessionLocal() as db:
        alex = db.scalar(select(User).where(User.username == "alex"))
        day = week_start(date.today()) - timedelta(days=21)
        db.add(DailyActivity(user_id=alex.id, date=day, xp_earned=5000, lessons_completed=50))
        db.commit()
    assert client.get("/api/me/profile").json()["top3_finishes"] == before + 1

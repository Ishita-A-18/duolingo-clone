"""Pure-logic tests: grading and heart regeneration."""
from datetime import datetime, timedelta
from types import SimpleNamespace

from app.core.config import settings
from app.services import hearts
from app.services.grading import match_text, normalize


def test_normalize_ignores_case_and_punctuation():
    assert normalize("  ¡Hola,   Ana! ") == "hola ana"


def test_exact_match():
    assert match_text("I drink water", ["I drink water."], allow_typo=True) == (True, None)


def test_missing_accents_accepted_with_note():
    ok, note = match_text("Adios", ["Adiós"], allow_typo=False)
    assert ok and "accent" in note


def test_single_typo_accepted_only_when_typing():
    assert match_text("I drnk water", ["I drink water"], allow_typo=True)[0]
    assert not match_text("I drnk water", ["I drink water"], allow_typo=False)[0]


def test_wrong_answer_rejected():
    assert match_text("I eat bread", ["I drink water"], allow_typo=True) == (False, None)


def _user(n: int, anchor: datetime):
    return SimpleNamespace(hearts=n, hearts_updated_at=anchor, gems=1000)


def test_hearts_regenerate_one_per_interval_and_keep_partial_progress():
    t0 = datetime(2026, 1, 1, 12)
    u = _user(2, t0)
    interval = timedelta(minutes=settings.heart_regen_minutes)
    hearts.sync_hearts(u, t0 + interval * 2 + timedelta(minutes=5))
    assert u.hearts == 4
    assert u.hearts_updated_at == t0 + interval * 2  # 5 minutes of progress kept


def test_hearts_cap_at_max():
    t0 = datetime(2026, 1, 1)
    u = _user(1, t0)
    hearts.sync_hearts(u, t0 + timedelta(days=5))
    assert u.hearts == settings.max_hearts
    assert hearts.next_heart_at(u) is None


def test_losing_first_heart_starts_the_countdown():
    t0, later = datetime(2026, 1, 1), datetime(2026, 1, 2)
    u = _user(settings.max_hearts, t0)
    hearts.lose_heart(u, later)
    assert u.hearts == settings.max_hearts - 1
    assert hearts.next_heart_at(u) == later + timedelta(minutes=settings.heart_regen_minutes)

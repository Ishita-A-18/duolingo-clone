"""Answer grading. Pure functions: no DB, no clock, easy to unit-test.

Matching is forgiving the way Duolingo is: case and punctuation never matter,
missing accents are accepted with a "watch the accents" note, and a single
typo in a typed answer is accepted with a "you have a typo" note.
"""
import re
import unicodedata
from dataclasses import dataclass

from app.core.errors import DomainError
from app.models import Exercise, ExerciseType

_PUNCT = re.compile(r"[.,!?¿¡;:\"'’“”()\-]")
_SPACES = re.compile(r"\s+")


@dataclass(frozen=True)
class AnswerInput:
    option_id: int | None = None
    option_ids: list[int] | None = None
    text: str | None = None
    skipped: bool = False  # "Skip" button: counts as a mistake


@dataclass(frozen=True)
class GradeResult:
    correct: bool
    solution: str | None  # canonical answer for the feedback bar
    note: str | None = None  # e.g. "You have a typo."
    submitted_text: str = ""


def normalize(text: str) -> str:
    text = _PUNCT.sub(" ", text.lower())
    return _SPACES.sub(" ", text).strip()


def strip_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn")


def levenshtein(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def match_text(submitted: str, accepted: list[str], allow_typo: bool) -> tuple[bool, str | None]:
    """Compare free text against accepted answers -> (correct, note)."""
    sub = normalize(submitted)
    if not sub:
        return False, None
    candidates = [normalize(a) for a in accepted]
    if sub in candidates:
        return True, None
    if strip_accents(sub) in {strip_accents(c) for c in candidates}:
        return True, "Pay attention to the accents."
    if allow_typo:
        for c in candidates:
            if len(c) >= 5 and levenshtein(strip_accents(sub), strip_accents(c)) <= 1:
                return True, "You have a typo."
    return False, None


def accepted_answers(exercise: Exercise) -> list[str]:
    return [a for a in [exercise.solution, *(x.text for x in exercise.accepted_answers)] if a]


def grade(exercise: Exercise, answer: AnswerInput) -> GradeResult:
    options = {o.id: o for o in exercise.options}
    t = exercise.type
    if answer.skipped:
        return GradeResult(False, exercise.solution, submitted_text="(skipped)")

    if t in (ExerciseType.MULTIPLE_CHOICE, ExerciseType.FILL_BLANK):
        chosen = options.get(answer.option_id) if answer.option_id is not None else None
        if chosen is None:
            raise DomainError("Pick one of the options.", code="invalid_answer")
        return GradeResult(chosen.is_correct, exercise.solution, submitted_text=chosen.text)

    if t == ExerciseType.TRANSLATE:
        # Word-bank tiles, or free text if the learner switched to the keyboard.
        if answer.option_ids is not None:
            if any(i not in options for i in answer.option_ids):
                raise DomainError("Unknown word tile.", code="invalid_answer")
            text = " ".join(options[i].text for i in answer.option_ids)
            allow_typo = False  # tiles can't contain typos
        elif answer.text is not None:
            text, allow_typo = answer.text, True
        else:
            raise DomainError("Build a sentence first.", code="invalid_answer")
        ok, note = match_text(text, accepted_answers(exercise), allow_typo)
        return GradeResult(ok, exercise.solution, note if ok else None, text)

    if t == ExerciseType.TYPE_ANSWER:
        if not answer.text:
            raise DomainError("Type an answer first.", code="invalid_answer")
        ok, note = match_text(answer.text, accepted_answers(exercise), allow_typo=True)
        return GradeResult(ok, exercise.solution, note if ok else None, answer.text)

    if t == ExerciseType.MATCH_PAIRS:
        # Pairing feedback is instant on the client; the server checks the
        # learner matched every pair before letting them continue.
        ok = sorted(answer.option_ids or []) == sorted(options)
        return GradeResult(ok, None, submitted_text="matched")

    raise DomainError(f"Unsupported exercise type {t}")

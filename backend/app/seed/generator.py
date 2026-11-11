"""Turn authored SkillContent into Lesson/Exercise rows.

Each lesson gets the same rhythm Duolingo uses: recognise a word, build
sentences from a word bank, fill a blank, match pairs, then produce an answer
by typing. A per-skill seeded RNG makes the output deterministic, so reseeding
always produces the same course.
"""
import json
import random
import re

from app.models import AcceptedAnswer, Exercise, ExerciseOption, ExerciseType, Lesson
from app.seed.content import GLOSSARY, UNITS, SkillContent, Word

LESSONS_PER_SKILL = 3
_TILE_STRIP = re.compile(r"[.,!?¿¡]")


def tiles(sentence: str) -> list[str]:
    return [t for t in _TILE_STRIP.sub("", sentence).split() if t]


def _build_glossary() -> dict[str, str]:
    """Hand-written glossary + every vocabulary word ("el café" -> café: coffee)."""
    gloss = {k.lower(): v for k, v in GLOSSARY.items()}
    for unit in UNITS:
        for skill in unit.skills:
            for w in skill.words:
                es, en = w.es.split(), w.en.split()
                if len(es) == 2 and len(en) == 2 and en[0] == "the":  # article + noun
                    gloss.setdefault(es[1].lower(), en[1])
                else:
                    gloss.setdefault(w.es.lower(), w.en)
                    for token in es:
                        gloss.setdefault(token.lower(), w.en)
    return gloss


HINTS = _build_glossary()


def prompt_hints(prompt: str) -> str:
    """JSON {token: meaning} for every word of a Spanish prompt we can gloss."""
    found = {t.lower(): HINTS[t.lower()] for t in tiles(prompt) if t.lower() in HINTS}
    return json.dumps(found, ensure_ascii=False)


def _shuffled(rng: random.Random, items: list) -> list:
    items = list(items)
    rng.shuffle(items)
    return items


def _options(rng, entries: list[tuple[str, bool, str | None]]) -> list[ExerciseOption]:
    return [
        ExerciseOption(position=i, text=text, is_correct=ok, image=img)
        for i, (text, ok, img) in enumerate(_shuffled(rng, entries))
    ]


def _distractor_words(rng, words: tuple[Word, ...], target: Word, n: int) -> list[Word]:
    return rng.sample([w for w in words if w != target], n)


def picture_choice(rng, words, target: Word) -> Exercise:
    others = _distractor_words(rng, words, target, 2)
    return Exercise(
        type=ExerciseType.MULTIPLE_CHOICE,
        instruction=f"Which one of these is “{target.en}”?",
        prompt=target.en,
        prompt_language="en",
        solution=target.es,
        options=_options(rng, [(target.es, True, target.emoji)] + [(w.es, False, w.emoji) for w in others]),
    )


def meaning_choice(rng, words, target: Word) -> Exercise:
    others = _distractor_words(rng, words, target, 2)
    return Exercise(
        type=ExerciseType.MULTIPLE_CHOICE,
        instruction="Select the correct meaning",
        prompt=target.en,
        prompt_language="en",
        solution=target.es,
        options=_options(rng, [(target.es, True, None)] + [(w.es, False, None) for w in others]),
    )


def word_bank(rng, prompt: str, prompt_lang: str, answer: str, alternatives, pool: list[str]) -> Exercise:
    """Translate `prompt` by tapping tiles; distractor tiles come from `pool`."""
    correct = tiles(answer)
    taken = {t.lower() for t in correct}
    spare = sorted({t for t in pool if t.lower() not in taken})
    distractors = rng.sample(spare, min(3, len(spare)))
    target = "English" if prompt_lang == "es" else "Spanish"
    return Exercise(
        type=ExerciseType.TRANSLATE,
        instruction=f"Write this in {target}",
        prompt=prompt,
        prompt_language=prompt_lang,
        prompt_hints=prompt_hints(prompt) if prompt_lang == "es" else None,
        solution=answer,
        options=_options(rng, [(t, True, None) for t in correct] + [(t, False, None) for t in distractors]),
        accepted_answers=[AcceptedAnswer(text=a) for a in alternatives],
    )


def fill_blank(rng, es: str, en: str, distractors) -> Exercise:
    word = re.search(r"\[(.+?)\]", es).group(1)
    return Exercise(
        type=ExerciseType.FILL_BLANK,
        instruction="Fill in the blank",
        prompt=en,
        prompt_language="en",
        sentence=re.sub(r"\[.+?\]", "___", es),
        solution=es.replace("[", "").replace("]", ""),
        options=_options(rng, [(word, True, None)] + [(d, False, None) for d in distractors]),
    )


def match_pairs(rng, words: list[Word]) -> Exercise:
    return Exercise(
        type=ExerciseType.MATCH_PAIRS,
        instruction="Select the matching pairs",
        options=[
            ExerciseOption(position=i, text=w.es, match_text=w.en, is_correct=True)
            for i, w in enumerate(words)
        ],
    )


def typed(prompt: str, prompt_lang: str, answer: str, alternatives) -> Exercise:
    target = "English" if prompt_lang == "es" else "Spanish"
    return Exercise(
        type=ExerciseType.TYPE_ANSWER,
        instruction=f"Type this in {target}",
        prompt=prompt,
        prompt_language=prompt_lang,
        prompt_hints=prompt_hints(prompt) if prompt_lang == "es" else None,
        solution=answer,
        accepted_answers=[AcceptedAnswer(text=a) for a in alternatives],
    )


def build_lessons(skill: SkillContent, seed: int) -> list[Lesson]:
    rng = random.Random(seed)
    words, sents = skill.words, skill.sentences
    en_pool = [t for s in sents for t in tiles(s.en)]
    es_pool = [t for s in sents for t in tiles(s.es)]

    lessons = []
    for i in range(LESSONS_PER_SKILL):
        a, b, c = sents[2 * i], sents[2 * i + 1], sents[(2 * i + 2) % len(sents)]
        blank = skill.blanks[i]
        pair_words = [words[(i + k) % len(words)] for k in range(5)]
        if i % 2 == 0:
            typing = typed(c.es, "es", c.en, c.alt_en)
        else:
            typing = typed(c.en, "en", c.es, c.alt_es)

        exercises = [
            picture_choice(rng, words, words[(2 * i) % len(words)]),
            word_bank(rng, a.es, "es", a.en, a.alt_en, en_pool),
            fill_blank(rng, blank.es, blank.en, blank.distractors),
            meaning_choice(rng, words, words[(2 * i + 1) % len(words)]),
            word_bank(rng, b.en, "en", b.es, b.alt_es, es_pool),
            match_pairs(rng, pair_words),
            typing,
        ]
        for pos, e in enumerate(exercises, 1):
            e.position = pos
        lessons.append(Lesson(position=i + 1, xp_reward=10, exercises=exercises))
    return lessons

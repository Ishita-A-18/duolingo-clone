# Design decisions

A running log of the non-obvious choices in this project: what was decided, why, and what it costs. New entries go at the bottom. Each entry is written so it can be explained in an interview.

---

## Product and UI

### D1. Copy the layout, palette and UX, but not the brand assets
**Decision.** The UI follows the original app closely: three-column desktop shell, the snaking learning path, chunky 3D buttons, the green/red feedback bar, celebration screens, the color palette and a rounded typeface. The name ("lingo"), wordmark and mascot ("Pip", drawn in SVG) are original. All icons are hand-drawn SVGs.
**Why.** The brief asks for a look-alike, and it also disqualifies plagiarism. Reusing the trademarked name, owl mascot or artwork would be both. Layout and interaction patterns can be recreated; brand assets can't.
**Trade-off.** It's a little less pixel-identical. The brand is one constant (`frontend/src/lib/brand.ts`).

### D2. Nunito as the typeface
The original uses proprietary fonts. Nunito is the closest freely licensed rounded sans, and it's loaded via `next/font` so there's no layout shift.

### D3. Design tokens as CSS variables, and the 3D button in CSS
Colors live in `globals.css` (`@theme` for Tailwind v4). Each color has a main, a dark "edge" and a light tint. The pressable button is one `.btn` class: a `box-shadow` bottom edge that disappears on `:active`. Variants only swap three CSS variables (`--btn-bg`, `--btn-edge`, `--btn-fg`). Every color is a CSS variable (`--bg`, `--text`, `--green`, `--feedback-ok-bg`, …), so dark mode only redefines those values (see D26).

### D4. Sounds are synthesized; audio uses the browser's TTS
Correct/wrong/complete chimes are generated with the Web Audio API (`lib/sound.ts`), so there are no audio assets to license. Prompts are read aloud with `speechSynthesis` (es-ES). This covers the "audio" bonus at zero cost.

---

## Backend architecture

### D5. Layered backend: routes → services → models
- `api/routes`: thin HTTP handlers (parse input, call a service, serialize).
- `services`: all game rules, as plain Python with no FastAPI imports. They raise `DomainError`s, not `HTTPException`s.
- `api/serializers.py`: maps domain objects to Pydantic response schemas.
- A single exception handler turns `DomainError` into `{"error": {"code", "message"}}`. The frontend branches on `code` (e.g. `out_of_hearts`), never on message text.

**Why.** The rules (hearts, streaks, grading) are testable without HTTP, and the API contract is defined in exactly one place (`schemas/`).

### D6. Auth is simplified behind one dependency
`get_current_user` returns the default learner, or the user named by an `X-User-Id` header. Every route depends on it, so adding real auth (JWT or sessions) means changing that one function.

### D7. `create_all` instead of Alembic migrations
The database is SQLite and is recreated and seeded on startup, so migrations would add ceremony with no benefit here. A production deployment would add Alembic.

---

## Database

### D8. Content hierarchy with explicit ordering
`courses → units → skills → lessons → exercises → exercise_options / accepted_answers`. Every child has a `position` column with a `UNIQUE(parent_id, position)` constraint, so order is explicit and can't be duplicated. All foreign keys use `ON DELETE CASCADE` (SQLite needs `PRAGMA foreign_keys=ON`, set per connection in `db.py`).

### D9. Exercise payloads are normalized, not a JSON blob
The five exercise types share one `exercises` table (`type` enum + `instruction`, `prompt`, `sentence`, `solution`). Their variable parts fit two child tables:
- `exercise_options`: choices, word-bank tiles, or match pairs (`text` + `match_text`), with an `is_correct` flag.
- `accepted_answers`: alternative correct translations.

**Why.** Options get real IDs, so answers are submitted as IDs, not by matching text. The grader also stays type-safe.
**Trade-off.** A brand-new exercise type with an exotic shape might need a new column. A JSON column would have been more flexible but unvalidated.

### D10. Learner state: counters on `users`, history in ledgers
`users` holds the hot counters (`total_xp`, `gems`, `hearts`, `current_streak`, `last_streak_date`) so the top bar is one cheap read. The history lives in:
- `daily_activity(user_id, date)`: one row per local day. It drives the daily goal, the streak calendar and the weekly leaderboard.
- `lesson_sessions` + `session_exercises` + `session_answers`: every attempt and every graded answer.
- `skill_progress(user_id, skill_id)`: lessons completed and crowns per skill.
- `user_achievements`: unlocked tiers.

**Trade-off.** `total_xp` is denormalized and must be updated in the same transaction that writes the ledger (`sessions.complete`).

### D11. Sessions get their own exercise list (`session_exercises`)
A lesson session copies its lesson's exercises. Heart practice samples exercises from everything learned so far, so its `lesson_id` is null. Giving each session its own ordered list lets one code path grade and complete both kinds.

---

## Game rules

### D12. Grading is server-authoritative
`POST /sessions` returns exercises without `is_correct` or accepted answers. Each answer goes to `POST /sessions/{id}/answers`, which grades it, logs it and deducts a heart. So hearts and XP can't be faked from the browser, and the full answer history exists for accuracy stats.
**Exception.** Match pairs needs instant per-tap feedback, so its pairings are sent to the client. Mismatched taps don't cost hearts. The server only verifies that every pair was matched.
**Cost.** One request per answer, roughly 100 ms. The Check button shows "Checking…" in the meantime.

### D13. Mistakes are re-queued; a lesson ends only when everything is solved
As in the original, a wrongly answered exercise goes to the back of the queue (marked "Previous mistake"). `complete` refuses (409) until every dealt exercise has at least one correct answer. Accuracy counts first-try answers only. The progress bar counts solved exercises, so it doesn't move on a mistake.

### D14. Forgiving answer matching
Case and punctuation are ignored. Missing accents are accepted with "Pay attention to the accents." When typing, one typo (Levenshtein ≤ 1, answers of 5+ chars) is accepted with "You have a typo." Word-bank answers can't contain typos, so they get no typo tolerance.

### D15. Hearts regenerate lazily
There's no background job. The user row stores `hearts` and `hearts_updated_at` (when the regen countdown started). Any read calls `sync_hearts`, which adds one heart per elapsed interval and keeps partial progress. Losing the first heart from full starts the countdown. Hearts can also be refilled with gems (350, mocked) or earned through heart practice (+1 heart, no hearts at risk). Lessons can't start at 0 hearts.

### D16. Streaks use the learner's local calendar day
`current_streak` + `last_streak_date`, read as:
- last = today → alive, already extended
- last = yesterday → alive, at risk
- older → broken (shown as 0)

The first lesson of a day extends the streak, and later ones don't. "Today" comes from the user's IANA timezone, which the frontend sends automatically on load (`PATCH /me {timezone}`), so midnight is the learner's midnight.

### D17. A simulated clock makes time-based rules testable
Every service gets time from a `Clock` (`core/clock.py`) instead of `datetime.now()`. The clock adds a day offset stored in `app_settings`. **Settings → Developer tools → "Simulate next day"** moves the server into tomorrow, so a reviewer can watch a streak extend, break or hearts regenerate without waiting. Because server time may run ahead of the browser, `/me` returns `next_heart_in_seconds` (computed on the server clock) rather than relying on the client's `Date.now()`.

### D18. Linear path progression, crowns from reviews
Like the modern path, progress is strictly linear: completed skills, then exactly one active skill, then locked ones. The state is derived on every read from `skill_progress`, never stored, so it can't drift. Finishing a skill's lessons awards crown level 1, and each review adds one, up to 5. The active node shows a progress ring of lessons completed.

### D19. XP rules
Lesson: 10 XP, +5 if perfect. Review: 5 (+5 if perfect). Heart practice: 5. All values live in `core/config.py` (env-overridable).

### D20. Achievements are tiers grouped by metric
Each `achievements` row is one tier (`metric`, `threshold`). Tiers sharing a metric form a family ("On Fire, level 2 of 4"). After each completion `evaluate()` unlocks every newly met tier and returns them, and the client shows them on an "Achievement unlocked" screen. Metrics: longest streak, total XP, lessons, perfect lessons, skills.

### D21. Seeded competitors are ordinary users
Leaderboard bots are `users` rows with `is_bot = true` and their own `daily_activity`. One query (`SUM(xp) GROUP BY user` for the current Monday–Sunday week) ranks real and seeded learners together. That also makes the "real functioning leaderboard" bonus nearly free.

### D22. Content is authored as data; exercises are generated
`seed/content.py` holds hand-written vocabulary, sentences and fill-in-the-blank items. `seed/generator.py` turns each skill into 3 lessons with the same rhythm: picture choice → translate (word bank) → fill blank → meaning choice → translate back → match pairs → type answer. A per-skill seeded RNG makes reseeding deterministic. Fill-blank distractors are chosen to be wrong given the English hint, so each blank has exactly one right answer.

---

## Frontend

### D23. Client-rendered pages with SWR
Every screen shows live per-learner data, so pages are client components backed by SWR. There's one cache key per backend read model (`me`, `path`, `profile`, `leaderboard`). After a lesson, `refreshLearnerData()` revalidates all of them, so the top bar, path and right rail update together. The scaffold's `cacheComponents` was turned off because static prerendering doesn't help here.

### D24. Lesson state machine as a reducer
`useLessonEngine` owns the queue, phase (`answering → checking → feedback`), hearts and combo counter. The player component only does I/O. Exercise components are dumb inputs that report a draft answer, and a registry (`exercises/index.ts`) maps `type → component`, so adding a type is one component plus one line.

### D25. Keyboard parity
Number keys pick options (1–9, 0 for the 10th match card), and Enter checks or continues, matching the original's desktop shortcuts.

---

## UI gap pass (compared against screenshots of the real app)

### D26. Dark mode via CSS variables and an explicit toggle
**Decision.** The reference screenshots were all in the original's dark theme, so dark mode moved from bonus to must-have. Every color is a CSS variable. Dark values apply when the OS prefers dark (unless the page is forced light), or when `<html data-theme="dark">` is set. Settings → Appearance offers System / Light / Dark.
**Details that matter.**
- In dark mode the primary green becomes a lighter lime with **dark text** (`--on-color`), and the feedback bar turns neutral slate instead of tinted, both matching the original.
- Icon fills that change by theme use `style={{ fill: "var(--…)" }}`, because SVG presentation attributes don't reliably resolve CSS variables.
- The preference lives in `localStorage`, since it's per-device display state, not learner progress. A tiny inline `<head>` script applies it before first paint, so there's no flash of the wrong theme. The picker reads it through `useSyncExternalStore`, which keeps server and client renders consistent.

### D27. Path stops: chest and practice nodes between lessons
**Decision.** The original's units show ~6 mixed stops, while ours had 3 lesson nodes. Each unit now renders: skill, skill, **chest**, skill, **practice**, trophy.
- The chest is real: it opens once the first two skills are complete and pays gems once.
- The practice node starts heart practice, which already exists.
- Placement is computed on the server (`chest.after_skill`) so the rule lives in one place.
- Locked nodes now show their icon greyed out instead of a padlock, the START bubble always says START, and a floating button scrolls back to the current lesson.
**Trade-off.** Lessons still group into skills (the brief asks for rings/crowns per skill), so nodes are skills rather than the original's one-node-per-level.

### D28. Rewards as an idempotent ledger (`user_rewards`)
Path chests and the daily-goal chest share one table keyed by a reward instance (`unit_chest:{unit_id}`, `daily_goal:{date}`) with `UNIQUE(user_id, key)`. Claiming checks state, inserts the row and adds gems in one transaction, so a chest can never pay out twice, even with double clicks or retries. It also gives gems an income source, since the economy was previously spend-only.

### D29. Lesson player polish from the references
- **Picture choice:** 3 cards, word bottom-left, key number bottom-right, plus a "New word" badge (the generator now picks 2 distractors).
- **After Check,** the chosen option turns green when right. A wrong pick stays blue, and the red feedback bar carries the signal; a later reference screenshot confirmed this, so an earlier "turn red" version was reverted (`choiceState()`).
- **Combo label** sits above the end of the filled bar, and the bar turns gold from 5 in a row (`HOT_COMBO`).
- **Feedback bar** has Too easy / Too difficult / Report links. These show a thank-you toast and aren't stored, since nothing in the brief consumes them.
- **Completion:** a "Review lesson" button lists each graded attempt from the lesson reducer's `log`, so it needs no extra API call. A daily-goal gem chest screen shows when the goal is reached.

### D30. Deliberate differences that remain
- **Mascot and illustrations:** Pip and emoji/SVG art instead of Duo and the original's illustrations, for originality (D1).
- **XP in the top bar and crowns on skills:** the original has neither today, but the brief explicitly requires both.
- **Typography:** Nunito instead of the original's proprietary fonts.
- **No onboarding questionnaire:** the brief assumes a default logged-in learner.

### D31. Leagues unlock after 10 lessons
The original's "Champion" achievement reads "Unlock Leaderboards by completing 10 lessons", so `league_unlock_lessons = 10` (config).
- `GET /leaderboard` returns `unlocked` and `lessons_to_unlock`. While locked, standings are empty, so the API never sends a locked learner other people's data.
- Locked real learners are excluded from everyone's league, via a correlated count of completed sessions. Seeded competitors (`is_bot`) always compete.
- The UI shows the teaser from the reference: shields, "Complete N more lessons to start competing", Start a lesson, and placeholder rows.
- The seeded learner has exactly 10 completed sessions, so the demo opens with leagues unlocked while new learners still see the teaser.

### D32. The right column depends on the page
The stats bar stays on top everywhere, because the brief requires streak/XP/hearts/gems in the top bar. The cards below follow the original per page:
- Learn: Super, league, quests
- Leaderboard: what leaderboards are
- Quests: monthly challenges
- Shop: league + quests
- Profile: friends + add friends

The mapping is one function (`railCards`) in `RightRail.tsx`.

### D33. Quests, Shop, Profile and the More menu follow the reference screenshots
- **Quests:** welcome banner, countdown to the daily reset (read from the browser clock through a ticking external store, which keeps render pure), and a locked "more quests unlock soon" card.
- **Shop:** Super banner, "Get for: 350" refill, and a "Free trial" button that shows a placeholder message.
- **Profile:** banner header with the avatar and an edit button, Following/Followers counts, 4 stat cards like the original (see D39 for Top 3 finishes), always-colored achievement badges labelled with the level being worked toward, and View all.
- **More:** a menu (Settings / Help / Log out) instead of a direct link. Help and Log out are placeholders, since auth is simplified.

### D34. Word hints are content, stored with the exercise
Spanish prompts show dotted-underlined words with their meaning on hover/tap, as in the original. The meanings live in `exercises.prompt_hints` (a JSON word→meaning map), generated at seed time from a glossary in `seed/content.py`. Every vocabulary item is added automatically, and function words and inflections are listed by hand.
- **Why stored, not computed per request:** hints are course content (the brief wants content in the database), and the API layer shouldn't import seed code.
- A test fails if any word in any Spanish prompt lacks a hint, so new content can't silently ship without them.

### D35. One-time free heart refill, through the reward ledger
The first time a learner runs out of hearts, the original offers "Have a free refill on us". We record it as a `user_rewards` row (`key = "free_refill"`, 0 gems), so the same unique constraint that makes chests idempotent guarantees it can only be used once (`409 free_refill_used`). `/me` exposes `free_refill_available` so the modal shows the right variant.

### D36. Lesson details from the second round of reference screenshots
- **Match pairs:** English on the left, Spanish on the right; renamed "Select the matching pairs"; Skip allowed.
- **"Select the correct meaning"** now asks with the English word and offers Spanish options.
- **Encouragement screens** appear at most once per lesson: "Don't give up!" when a mistake leaves 1 heart, and "You're on fire!" at a 5-answer combo. The mascot peeks up from the footer line.
- **Small details:**
  - "Previous mistake" gets its orange icon.
  - The combo label starts at 2, and "Nice!" is added to the praise lines.
  - The title reads "Lesson Complete!", and the stat-card headers use the theme's on-color text.
  - The time card only appears when the lesson was quick.
- **Streak screen:** "Come back tomorrow for streak day 2!" (or "N day streak!"), the mascot by a campfire, and a week strip that looks forward (completed days ✓, tomorrow dashed) with a tip box.

### D37. Preferences page with real lesson-experience toggles
The settings page follows the original's "Preferences" layout: Lesson experience toggles, Appearance → Dark mode dropdown (System default / On / Off), and Account / Subscription / Support link cards on the right.

Each toggle actually changes behaviour, rather than being decorative:

| Toggle | Effect |
|---|---|
| Sound effects | Turns the answer and celebration sounds on or off |
| Animations | Sets `<html data-animations="off">`; one CSS rule stops all keyframe animations and transitions, and confetti is skipped |
| Motivational messages | Turns off the mid-lesson encouragement screens |
| Listening exercises | Stops prompts and tapped Spanish words being read aloud. The demo has no listening-type exercises, so automatic audio is the closest real equivalent. |

They're stored per learner as boolean columns on `users` (alongside `sound_enabled`), because they describe how the learner wants lessons to behave on any device. Theme stays in `localStorage` because it's a per-device display choice (D26).

The quit modal now uses the original's single headline ("Wait, don't go! You'll lose your progress if you quit now"). The Super card's button matches the original's indigo "Start my free month" and shows a placeholder message.

### D38. Help Center: the original's layout, this app's own content
`/help` mirrors the original's FAQ page: a slim header, breadcrumb, centered title, rounded category cards with expandable questions, and "Still unsure about something?" with Send feedback. The questions and answers are written for *this* app, and their numbers match the backend config (5 hearts, 1 per hour, leagues unlock at 10 lessons, top 7 promoted, 4 daily-goal levels). That keeps it useful to a reviewer and avoids copying the original's text.
- Each question is a native `<details>`/`<summary>`, so keyboard and screen-reader support come for free.
- Content lives in `app/help/faq.ts`, separate from the markup.
- Send feedback opens a small form that confirms with a toast; there's no support inbox to send it to in this demo.

### D39. "Top 3 finishes" computed from activity history
The profile's 4th card matches the original: weeks you finished in 1st–3rd place. There's no league-history table; every past week is **re-ranked from `daily_activity`** with the same query as the live league (`leaderboard._ranked`). Only weeks where the learner earned XP are checked, since a week with no XP can't be a top-3 finish.
- **Why not store results:** weekly results are fully determined by data we already keep, and storing them would need a weekly job and a second source of truth.
- **Trade-off:** past weeks are ranked with *today's* league eligibility (bots + learners who have unlocked leagues), not eligibility as it was that week.
- **Seed data:** competitors now have two past weeks of XP, so history is a real competition. The seeded learner has 0 finishes.
- Crowns stay on the path (required per skill) and appear in the profile's summary line.

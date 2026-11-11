"use client";

import { formatDuration } from "@/lib/format";
import type { AnswerResult } from "@/lib/types";
import { CheckIcon, CloseIcon, FlagOutlineIcon, GemChip, HeartIcon, MountainIcon } from "../icons";
import { Mascot } from "../Mascot";
import { Modal, ProgressBar } from "../ui";

/** Combo length at which the progress bar turns gold, like the original's streak-of-answers flourish. */
export const HOT_COMBO = 5;

export function LessonHeader({ progress, hearts, heartsAtRisk, combo, onQuit, challenge }: {
  progress: number;
  hearts: number;
  heartsAtRisk: boolean;
  combo: number;
  onQuit: () => void;
  /** Legendary challenge: countdown + mistakes left replace the hearts. */
  challenge?: { secondsLeft: number; mistakesLeft: number };
}) {
  const hot = combo >= HOT_COMBO;
  // The "N IN A ROW" label rides above the end of the filled bar.
  const labelAt = Math.min(Math.max(progress * 100, 8), 92);
  return (
    <header className="mx-auto flex w-full max-w-[1000px] items-center gap-4 px-4 pt-6 sm:px-10 sm:pt-12">
      <button onClick={onQuit} aria-label="Quit lesson" className="text-gray hover:text-ink-muted">
        <CloseIcon size={28} />
      </button>
      <div className="relative flex-1">
        <ProgressBar value={progress} color={hot ? "var(--color-gold)" : "var(--color-green)"} />
        {combo >= 2 && (
          <span
            key={combo}
            className={`absolute -top-7 -translate-x-1/2 animate-pop whitespace-nowrap text-sm font-black uppercase tracking-wide ${hot ? "text-gold" : "text-green"}`}
            style={{ left: `${labelAt}%` }}
          >
            {combo} in a row
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-lg font-extrabold">
        {challenge ? (
          <>
            <span
              className={`rounded-xl px-2.5 py-1 tabular-nums ${challenge.secondsLeft <= 30 ? "bg-red-light text-red" : "bg-gold-light text-gold-dark"}`}
              aria-label="Time left"
            >
              ⏱ {formatDuration(challenge.secondsLeft)}
            </span>
            <span className="text-sm font-extrabold uppercase text-ink-muted" aria-label="Mistakes left">
              ✖ {challenge.mistakesLeft}
            </span>
          </>
        ) : heartsAtRisk ? (
          <>
            <HeartIcon size={30} muted={hearts === 0} />
            <span className="text-red">{hearts}</span>
          </>
        ) : (
          <span className="rounded-xl bg-blue-light px-2 py-1 text-xs font-extrabold uppercase text-blue-dark">Practice</span>
        )}
      </div>
    </header>
  );
}

const PRAISE = ["Nice!", "Good job!", "Nicely done!", "Great job!", "Amazing!", "Correct!", "Awesome!"];

export type ExerciseFeedbackKind = "too_easy" | "too_difficult" | "report";

/**
 * The bottom bar. Neutral while answering (Skip / Check); after grading it
 * shows the result, the solution, the rate/report links, and Continue.
 * Colors come from theme variables: tinted green/red in light mode,
 * neutral slate in dark mode (as in the original).
 */
export function FeedbackFooter({ phase, feedback, attempt, canCheck, canSkip, onCheck, onSkip, onContinue, onRate }: {
  attempt: number;
  phase: "answering" | "checking" | "feedback";
  feedback: AnswerResult | null;
  canCheck: boolean;
  canSkip: boolean;
  onCheck: () => void;
  onSkip: () => void;
  onContinue: () => void;
  onRate: (kind: ExerciseFeedbackKind) => void;
}) {
  const graded = phase === "feedback" && feedback;
  const ok = graded && feedback.correct;
  const praise = PRAISE[attempt % PRAISE.length];

  return (
    <footer
      className={graded ? "border-t-2 border-transparent" : "border-t-2 border-line"}
      style={graded ? { background: ok ? "var(--feedback-ok-bg)" : "var(--feedback-bad-bg)" } : undefined}
    >
      <div className="mx-auto flex min-h-[140px] max-w-[1000px] flex-col justify-center gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        {graded ? (
          <div className="flex animate-slide-up items-center gap-4 sm:animate-pop">
            <span
              className={`hidden h-20 w-20 shrink-0 items-center justify-center rounded-full sm:flex ${ok ? "text-green" : "text-red"}`}
              style={{ background: "var(--feedback-icon-bg)" }}
            >
              {ok ? <CheckIcon size={44} /> : <CloseIcon size={40} />}
            </span>
            <div className={ok ? "text-green-dark" : "text-red-dark"}>
              <p className="text-2xl font-extrabold">{ok ? praise : "Correct solution:"}</p>
              {!ok && feedback.solution && <p className="text-lg font-semibold">{feedback.solution}</p>}
              {ok && feedback.note && (
                <p className="text-base font-semibold">
                  {feedback.note} {feedback.solution && <>Answer: {feedback.solution}</>}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[15px] font-extrabold tracking-wide">
                <button className="flex items-center gap-1.5 uppercase hover:opacity-75" onClick={() => onRate("too_easy")}>
                  <span className="text-xs">z<sub>z</sub></span> Too easy
                </button>
                <button className="flex items-center gap-1.5 uppercase hover:opacity-75" onClick={() => onRate("too_difficult")}>
                  <MountainIcon size={18} /> Too difficult
                </button>
                <button className="flex items-center gap-1.5 uppercase hover:opacity-75" onClick={() => onRate("report")}>
                  <FlagOutlineIcon size={18} /> Report
                </button>
              </div>
            </div>
          </div>
        ) : (
          canSkip && (
            <button className="btn btn-outline hidden sm:inline-flex sm:w-[150px]" onClick={onSkip} disabled={phase !== "answering"}>
              Skip
            </button>
          )
        )}

        {graded ? (
          <button className={`btn w-full sm:w-[150px] ${ok ? "" : "btn-red"}`} onClick={onContinue} autoFocus>
            Continue
          </button>
        ) : (
          <button className="btn w-full sm:ml-auto sm:w-[150px]" onClick={onCheck} disabled={!canCheck || phase !== "answering"}>
            {phase === "checking" ? "Checking…" : "Check"}
          </button>
        )}
      </div>
    </footer>
  );
}

export function QuitModal({ open, onStay, onQuit }: { open: boolean; onStay: () => void; onQuit: () => void }) {
  return (
    <Modal open={open} onClose={onStay}>
      <Mascot mood="sad" size={120} className="mx-auto" />
      <h2 className="mt-5 text-2xl font-extrabold leading-snug text-ink-strong">
        Wait, don&apos;t go! You&apos;ll lose your progress if you quit now
      </h2>
      <button className="btn btn-blue mt-6 w-full" onClick={onStay}>Keep learning</button>
      <button className="btn btn-ghost mt-2 w-full !text-red" onClick={onQuit}>End session</button>
    </Modal>
  );
}

export function OutOfHeartsModal({ open, gems, cost, freeAvailable, onRefillFree, onRefill, onPractice, onQuit, busy }: {
  open: boolean;
  gems: number;
  cost: number;
  freeAvailable: boolean;
  onRefillFree: () => void;
  onRefill: () => void;
  onPractice: () => void;
  onQuit: () => void;
  busy: boolean;
}) {
  // First time out of hearts: one free refill, a single button (as in the original).
  if (freeAvailable) {
    return (
      <Modal open={open}>
        <div className="relative mx-auto w-fit">
          <Mascot mood="cheer" size={120} />
          <HeartIcon size={56} className="absolute -right-8 top-2" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold leading-snug text-ink-strong">
          You ran out of hearts. Have a free refill on us to keep going!
        </h2>
        <button className="btn btn-blue mt-6 w-full" onClick={onRefillFree} disabled={busy}>
          Refill for free
        </button>
      </Modal>
    );
  }
  return (
    <Modal open={open}>
      <div className="relative mx-auto w-fit">
        <Mascot mood="sad" size={120} />
        <HeartIcon size={44} muted className="absolute -right-6 bottom-2" />
      </div>
      <h2 className="mt-4 text-2xl font-extrabold text-ink-strong">You ran out of hearts!</h2>
      <p className="mt-2 font-semibold text-ink-muted">Refill now to keep going, or practice to earn hearts back.</p>
      <button className="btn btn-blue mt-6 w-full" onClick={onRefill} disabled={busy || gems < cost}>
        Refill <GemChip /> {cost}
      </button>
      <button className="btn btn-outline mt-3 w-full !text-green" onClick={onPractice} disabled={busy}>
        Practice to earn hearts
      </button>
      <button className="btn btn-ghost mt-2 w-full !text-ink-muted" onClick={onQuit} disabled={busy}>
        No thanks
      </button>
      {gems < cost && <p className="mt-2 text-sm font-bold text-ink-muted">You have {gems} gems.</p>}
    </Modal>
  );
}


/**
 * Mid-lesson encouragement (e.g. "Don't give up!" on the last heart): the
 * mascot peeks up from the footer line with a speech bubble, like the original.
 */
export function Encouragement({ message, mood = "happy" }: { message: string; mood?: "happy" | "cheer" }) {
  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-1 items-end px-4">
      <div className="flex animate-slide-up items-end gap-3">
        <Mascot mood={mood} size={150} className="-mb-2" />
        <div className="relative mb-16 rounded-2xl border-2 border-line px-5 py-3 text-xl font-bold text-ink-strong">
          <span className="absolute -left-[9px] bottom-5 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-bg" />
          {message}
        </div>
      </div>
    </div>
  );
}

/** Legendary challenge lost: out of time or out of allowed mistakes. */
export function ChallengeFailed({ reason, onRetry, onExit }: { reason: "time" | "mistakes"; onRetry: () => void; onExit: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 animate-pop flex-col items-center justify-center gap-5 px-4 text-center">
        <Mascot mood="sad" size={170} />
        <h1 className="text-3xl font-extrabold text-ink-strong">Challenge failed</h1>
        <p className="max-w-sm text-lg font-semibold text-ink-muted">
          {reason === "time" ? "Time ran out before you finished." : "That was one mistake too many."} Practice a little more and try again!
        </p>
      </div>
      <footer className="border-t-2 border-line">
        <div className="mx-auto flex min-h-[140px] max-w-[1000px] flex-col-reverse justify-center gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <button className="btn btn-outline w-full sm:w-[180px]" onClick={onExit}>Back to path</button>
          <button className="btn btn-gold w-full sm:w-[180px]" onClick={onRetry} autoFocus>Try again</button>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useReducer } from "react";
import type { Answer, AnswerResult, Exercise, LessonSession } from "@/lib/types";

/**
 * Client-side lesson state machine.
 *
 *   answering --check--> checking --graded--> feedback --continue--> answering (next)
 *
 * Grading happens on the server; this reducer only orders the queue. An
 * exercise answered wrongly goes to the back of the queue so it must be
 * retried, which is why progress counts *solved* exercises, not attempts.
 */
export type Phase = "answering" | "checking" | "feedback";

/** One graded attempt, kept for the "Review lesson" screen. */
export interface ReviewEntry {
  exercise: Exercise;
  correct: boolean;
  solution: string | null;
}

export interface LessonState {
  queue: Exercise[]; // queue[0] is the current exercise
  attempt: number; // bumps on every new card so exercise components reset
  total: number;
  solved: number;
  draft: Answer | null;
  phase: Phase;
  feedback: AnswerResult | null;
  hearts: number;
  combo: number; // consecutive correct answers
  log: ReviewEntry[];
}

type Action =
  | { type: "draft"; answer: Answer | null }
  | { type: "checking" }
  | { type: "graded"; result: AnswerResult }
  | { type: "check_failed" }
  | { type: "next" }
  | { type: "hearts"; hearts: number };

function reducer(s: LessonState, a: Action): LessonState {
  switch (a.type) {
    case "draft":
      return s.phase === "answering" ? { ...s, draft: a.answer } : s;
    case "checking":
      return { ...s, phase: "checking" };
    case "check_failed":
      return { ...s, phase: "answering" };
    case "graded":
      return {
        ...s,
        phase: "feedback",
        feedback: a.result,
        hearts: a.result.hearts,
        solved: s.solved + (a.result.correct ? 1 : 0),
        combo: a.result.correct ? s.combo + 1 : 0,
        log: [...s.log, { exercise: s.queue[0], correct: a.result.correct, solution: a.result.solution }],
      };
    case "next": {
      const [current, ...rest] = s.queue;
      const queue = s.feedback?.correct ? rest : [...rest, current];
      return { ...s, queue, attempt: s.attempt + 1, draft: null, phase: "answering", feedback: null };
    }
    case "hearts":
      return { ...s, hearts: a.hearts };
  }
}

export function useLessonEngine(session: LessonSession, startingHearts: number) {
  return useReducer(reducer, undefined, () => ({
    queue: session.exercises,
    attempt: 0,
    total: session.exercises.length,
    solved: 0,
    draft: null,
    phase: "answering" as Phase,
    feedback: null,
    hearts: startingHearts,
    combo: 0,
    log: [],
  }));
}

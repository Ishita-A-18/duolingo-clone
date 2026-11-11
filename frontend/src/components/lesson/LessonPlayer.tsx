"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { mutate } from "swr";
import { api, ApiError } from "@/lib/api";
import { KEYS, refreshLearnerData, useMe } from "@/lib/hooks";
import { playSound } from "@/lib/sound";
import type { Answer, Completion, Exercise, LessonSession } from "@/lib/types";
import { CrownIcon, RetryIcon, SparkleIcon, TrophyIcon } from "../icons";
import { useToast } from "../Toasts";
import { ErrorState, Spinner } from "../ui";
import { EXERCISES } from "./exercises";
import { ChallengeFailed, Encouragement, FeedbackFooter, HOT_COMBO, LessonHeader, OutOfHeartsModal, QuitModal } from "./LessonChrome";
import { LessonSummary } from "./LessonSummary";
import { useLessonEngine } from "./useLessonEngine";

/** Picture-card questions introduce vocabulary, so they get the "New word" badge. */
const isNewWord = (e: Exercise) => e.type === "multiple_choice" && e.options.length > 0 && e.options.every((o) => o.image);

type Loaded =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "no_hearts" } // couldn't even start
  | { status: "ready"; session: LessonSession };

/**
 * Starts a session via `start` and runs it. Shared by skill lessons, reviews
 * and heart practice; they differ only in how the session is created.
 */
export function LessonPlayer({ start }: { start: () => Promise<LessonSession> }) {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const startedRef = useRef(false);
  const router = useRouter();
  const { data: me } = useMe();

  const load = useCallback(() => {
    setLoaded({ status: "loading" });
    start()
      .then((session) => setLoaded({ status: "ready", session }))
      .catch((e: unknown) =>
        e instanceof ApiError && e.code === "out_of_hearts"
          ? setLoaded({ status: "no_hearts" })
          : setLoaded({ status: "error", message: e instanceof Error ? e.message : "Couldn't start the lesson." }),
      );
  }, [start]);

  useEffect(() => {
    // Guard against React StrictMode's double effect creating two sessions.
    if (startedRef.current) return;
    startedRef.current = true;
    load();
  }, [load]);

  if (loaded.status === "loading") return <div className="pt-40"><Spinner /></div>;
  if (loaded.status === "error")
    return <ErrorState message={loaded.message} onRetry={() => router.push("/learn")} />;
  if (loaded.status === "no_hearts")
    return (
      <HeartsGate
        gems={me?.gems ?? 0}
        cost={me?.heart_refill_cost ?? 350}
        freeAvailable={me?.free_refill_available ?? false}
        onRefilled={load}
        onPractice={() => router.push("/practice")}
        onQuit={() => router.push("/learn")}
      />
    );
  return <ActiveLesson session={loaded.session} startingHearts={me?.hearts ?? 5} />;
}

function HeartsGate({ gems, cost, freeAvailable, onRefilled, onPractice, onQuit }: {
  gems: number; cost: number; freeAvailable: boolean; onRefilled: () => void; onPractice: () => void; onQuit: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const refill = async (free = false) => {
    setBusy(true);
    try {
      await mutate(KEYS.me, api.refillHearts(free), { revalidate: false });
      onRefilled();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Couldn't refill", tone: "error" });
      setBusy(false);
    }
  };
  return (
    <OutOfHeartsModal
      open gems={gems} cost={cost} busy={busy} freeAvailable={freeAvailable}
      onRefillFree={() => refill(true)} onRefill={() => refill()} onPractice={onPractice} onQuit={onQuit}
    />
  );
}

function ActiveLesson({ session, startingHearts }: { session: LessonSession; startingHearts: number }) {
  const [s, dispatch] = useLessonEngine(session, startingHearts);
  const [quitOpen, setQuitOpen] = useState(false);
  const [heartsOpen, setHeartsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Completion | null>(null);
  // Legendary challenge: countdown and failure state (the server enforces both too).
  const timeLimit = session.time_limit_seconds;
  const [secondsLeft, setSecondsLeft] = useState(timeLimit ?? 0);
  const [failed, setFailed] = useState<"time" | "mistakes" | null>(null);
  // Mid-lesson encouragement screens, each shown at most once per lesson.
  const [encourage, setEncourage] = useState<{ message: string; mood: "happy" | "cheer" } | null>(null);
  const shownRef = useRef(new Set<string>());
  const router = useRouter();
  const toast = useToast();
  const { data: me } = useMe();
  const sound = me?.sound_enabled ?? true;

  useEffect(() => {
    if (!timeLimit || result || failed) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, timeLimit - Math.floor((Date.now() - startedAt) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(id);
        setFailed("time");
      }
    }, 250);
    return () => clearInterval(id);
  }, [timeLimit, result, failed]);

  const current = s.queue[0];
  const Exercise = current ? EXERCISES[current.type] : null;

  const submit = useCallback(
    async (answer: Answer) => {
      if (!current) return;
      dispatch({ type: "checking" });
      try {
        const res = await api.answer(session.id, current.id, answer);
        playSound(res.correct ? "correct" : "wrong", sound);
        dispatch({ type: "graded", result: res });
      } catch (e) {
        dispatch({ type: "check_failed" });
        if (e instanceof ApiError && e.code === "time_up") setFailed("time");
        else if (e instanceof ApiError && e.code === "out_of_hearts") setHeartsOpen(true);
        else toast({ title: e instanceof Error ? e.message : "Couldn't check that", tone: "error" });
      }
    },
    [current, dispatch, session.id, sound, toast],
  );

  const finish = useCallback(async () => {
    setBusy(true);
    try {
      const done = await api.complete(session.id);
      setResult(done);
      refreshLearnerData();
    } catch (e) {
      if (e instanceof ApiError && e.code === "time_up") setFailed("time");
      else toast({ title: e instanceof Error ? e.message : "Couldn't finish the lesson", tone: "error" });
    } finally {
      setBusy(false);
    }
  }, [session.id, toast]);

  const next = useCallback(() => {
    if (!s.feedback) return;
    if (s.feedback.challenge_failed) {
      setFailed("mistakes");
      return;
    }
    if (!s.feedback.correct && session.hearts_at_risk && s.hearts <= 0) {
      setHeartsOpen(true);
      return;
    }
    if (s.feedback.correct && s.queue.length === 1) {
      finish();
      return;
    }
    dispatch({ type: "next" });
    const once = (key: string, message: string, mood: "happy" | "cheer") => {
      if (shownRef.current.has(key) || me?.motivational_messages === false) return;
      shownRef.current.add(key);
      setEncourage({ message, mood });
    };
    if (!s.feedback.correct && session.hearts_at_risk && s.hearts === 1) once("last_heart", "Don't give up!", "happy");
    else if (s.feedback.correct && s.combo === HOT_COMBO) once("combo", `You're on fire! ${HOT_COMBO} in a row!`, "cheer");
  }, [s.feedback, s.hearts, s.combo, s.queue.length, session.hearts_at_risk, finish, dispatch, me?.motivational_messages]);

  const quit = (to = "/learn") => {
    api.abandon(session.id).catch(() => {});
    mutate(KEYS.me);
    router.push(to);
  };

  const refill = async (free = false) => {
    setBusy(true);
    try {
      const updated = await api.refillHearts(free);
      mutate(KEYS.me, updated, { revalidate: false });
      dispatch({ type: "hearts", hearts: updated.hearts });
      setHeartsOpen(false);
      if (s.phase === "feedback") dispatch({ type: "next" }); // move on to the retry
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Couldn't refill", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  // Enter = Check / Continue, like the original.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || quitOpen || heartsOpen || failed || result || busy) return;
      e.preventDefault();
      if (encourage) setEncourage(null);
      else if (s.phase === "feedback") next();
      else if (s.phase === "answering" && s.draft) submit(s.draft);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s.phase, s.draft, next, submit, quitOpen, heartsOpen, failed, result, busy, encourage]);

  if (failed) {
    return <ChallengeFailed reason={failed} onRetry={() => window.location.reload()} onExit={() => router.push("/learn")} />;
  }

  if (result) {
    return (
      <LessonSummary
        result={result}
        mode={session.mode}
        me={me}
        log={s.log}
        onDone={() => {
          if (result.legendary_now)
            toast({ title: `${session.skill_title} is Legendary!`, body: "This skill is now gold on your path.", icon: <TrophyIcon size={30} />, tone: "gold" });
          else if (result.unit_completed_now)
            toast({ title: "Unit complete!", body: "You unlocked the next unit.", icon: <TrophyIcon size={30} />, tone: "gold" });
          else if (result.skill_completed_now)
            toast({ title: `${session.skill_title} complete!`, body: "You earned a crown.", icon: <CrownIcon size={30} />, tone: "gold" });
          router.push("/learn");
        }}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <LessonHeader
        progress={s.solved / s.total}
        hearts={s.hearts}
        heartsAtRisk={session.hearts_at_risk}
        combo={s.combo}
        onQuit={() => setQuitOpen(true)}
        challenge={
          timeLimit
            ? { secondsLeft, mistakesLeft: Math.max(0, (session.mistakes_allowed ?? 0) - s.log.filter((l) => !l.correct).length) }
            : undefined
        }
      />

      {encourage ? (
        <>
          <Encouragement message={encourage.message} mood={encourage.mood} />
          <footer className="border-t-2 border-line">
            <div className="mx-auto flex min-h-[140px] max-w-[1000px] items-center justify-end px-4 sm:px-10">
              <button className="btn w-full sm:w-[150px]" onClick={() => setEncourage(null)} autoFocus>Continue</button>
            </div>
          </footer>
        </>
      ) : (
      <>
      <main className="mx-auto flex w-full max-w-[600px] flex-1 flex-col justify-center gap-8 px-4 py-8">
        {current && Exercise && (
          <>
            <div>
              {s.attempt >= s.total ? (
                <p className="mb-2 flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-wide text-orange">
                  <RetryIcon size={26} /> Previous mistake
                </p>
              ) : (
                isNewWord(current) && (
                  <p className="mb-2 flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-wide text-purple">
                    <SparkleIcon size={26} /> New word
                  </p>
                )
              )}
              <h1 className="text-2xl font-extrabold text-ink-strong sm:text-3xl">{current.instruction}</h1>
            </div>
            <Exercise
              key={`${current.id}-${s.attempt}`}
              exercise={current}
              locked={s.phase !== "answering"}
              result={s.phase === "feedback" && s.feedback ? (s.feedback.correct ? "correct" : "wrong") : null}
              onChange={(answer) => dispatch({ type: "draft", answer })}
              onSubmit={submit}
              sound={sound}
              listening={me?.listening_enabled ?? true}
            />
          </>
        )}
      </main>

      <FeedbackFooter
        phase={busy ? "checking" : s.phase}
        feedback={s.feedback}
        attempt={s.attempt}
        canCheck={!!s.draft}
        canSkip
        onCheck={() => s.draft && submit(s.draft)}
        onSkip={() => submit({ skipped: true })}
        onContinue={next}
        onRate={(kind) =>
          toast({
            title: kind === "report" ? "Thanks for reporting!" : "Thanks for the feedback!",
            body: "It helps us tune future lessons.",
            tone: "info",
          })
        }
      />
      </>
      )}

      <QuitModal open={quitOpen} onStay={() => setQuitOpen(false)} onQuit={() => quit()} />
      <OutOfHeartsModal
        open={heartsOpen}
        gems={me?.gems ?? 0}
        cost={me?.heart_refill_cost ?? 350}
        busy={busy}
        freeAvailable={me?.free_refill_available ?? false}
        onRefillFree={() => refill(true)}
        onRefill={() => refill()}
        onPractice={() => quit("/practice")}
        onQuit={() => quit()}
      />
    </div>
  );
}

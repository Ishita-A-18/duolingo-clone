"use client";

import confetti from "canvas-confetti";
import { useEffect, useState, type ReactNode } from "react";
import { addDays, formatDuration, weekdayShort } from "@/lib/format";
import { playSound } from "@/lib/sound";
import type { Completion, LessonSession, Me } from "@/lib/types";
import { ACHIEVEMENT_ICONS, BoltIcon, CheckIcon, CloseIcon, FlameIcon, HeartIcon, TargetIcon } from "../icons";
import { Mascot } from "../Mascot";
import { GemReward } from "../Reward";
import { Modal } from "../ui";
import type { ReviewEntry } from "./useLessonEngine";

type Screen = "complete" | "gems" | "streak" | "achievements";

/**
 * The celebratory screens after a lesson, shown one after another:
 * lesson complete -> daily-goal chest -> streak -> achievements.
 * "Review lesson" is available throughout.
 */
export function LessonSummary({ result, mode, me, log, onDone }: {
  result: Completion;
  mode: LessonSession["mode"];
  me: Me | undefined;
  log: ReviewEntry[];
  onDone: () => void;
}) {
  const screens: Screen[] = ["complete"];
  if (result.gems_earned > 0) screens.push("gems");
  if (result.streak.extended_today) screens.push("streak");
  if (result.achievements_unlocked.length) screens.push("achievements");
  const [index, setIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const screen = screens[index];
  const next = () => (index + 1 < screens.length ? setIndex(index + 1) : onDone());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Enter" && !reviewing && next();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <div key={screen} className="flex flex-1 animate-pop flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        {screen === "complete" && (
          <CompleteScreen result={result} mode={mode} sound={me?.sound_enabled ?? true} animations={me?.animations_enabled ?? true} />
        )}
        {screen === "gems" && <GemReward gems={result.gems_earned} message="Nice job reaching your daily goal!" />}
        {screen === "streak" && <StreakScreen result={result} me={me} />}
        {screen === "achievements" && <AchievementsScreen result={result} />}
      </div>
      <footer className="border-t-2 border-line">
        <div className="mx-auto flex min-h-[140px] max-w-[1000px] flex-col-reverse justify-center gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <button className="btn btn-outline w-full sm:w-[220px]" onClick={() => setReviewing(true)}>
            Review lesson
          </button>
          <button className="btn w-full sm:w-[180px]" onClick={next} autoFocus>
            Continue
          </button>
        </div>
      </footer>
      <ReviewModal open={reviewing} log={log} onClose={() => setReviewing(false)} />
    </div>
  );
}

/** Every graded attempt in order: what was asked, whether it was right, and the answer. */
function ReviewModal({ open, log, onClose }: { open: boolean; log: ReviewEntry[]; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} className="!max-w-lg text-left">
      <h2 className="text-center text-2xl font-extrabold text-ink-strong">Lesson review</h2>
      <ol className="mt-4 flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
        {log.map((entry, i) => (
          <li key={i} className="flex gap-3 rounded-2xl border-2 border-line p-3">
            <span className={`mt-0.5 shrink-0 ${entry.correct ? "text-green" : "text-red"}`}>
              {entry.correct ? <CheckIcon size={22} /> : <CloseIcon size={22} />}
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-ink-strong">{entry.exercise.instruction}</p>
              {entry.exercise.prompt && entry.exercise.type !== "multiple_choice" && (
                <p className="font-semibold text-ink-muted">{entry.exercise.prompt}</p>
              )}
              <p className={`font-semibold ${entry.correct ? "text-green-dark" : "text-red-dark"}`}>
                {entry.solution ?? "All pairs matched"}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <button className="btn mt-5 w-full" onClick={onClose}>Done</button>
    </Modal>
  );
}

function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setValue(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return value;
}

function CompleteScreen({ result, mode, sound, animations }: {
  result: Completion; mode: LessonSession["mode"]; sound: boolean; animations: boolean;
}) {
  const xp = useCountUp(result.xp_earned);
  useEffect(() => {
    playSound("complete", sound);
    if (animations) confetti({ zIndex: 40, particleCount: 140, spread: 90, origin: { y: 0.35 }, colors: ["#58cc02", "#1cb0f6", "#ffc800", "#ff4b4b", "#ce82ff"] });
  }, [sound, animations]);

  const accuracyLabel = result.accuracy === 100 ? "Amazing" : result.accuracy >= 80 ? "Good" : "Not bad";
  const quick = result.duration_seconds < 120;

  return (
    <>
      <Mascot mood="cheer" size={180} />
      <h1 className="text-3xl font-black text-gold-dark sm:text-4xl">
        {mode === "heart_practice"
          ? "Practice complete!"
          : mode === "legendary"
            ? "Legendary!"
            : result.mistakes === 0
              ? "Perfect Lesson!"
              : "Lesson Complete!"}
      </h1>
      {result.heart_gained && (
        <p className="flex items-center gap-2 text-lg font-extrabold text-red">
          <HeartIcon size={26} /> You earned a heart back!
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-4">
        <StatCard label="Total XP" color="var(--color-gold)" icon={<BoltIcon size={24} />} value={xp} />
        <StatCard label={accuracyLabel} color="var(--color-green)" icon={<TargetIcon size={22} />} value={`${result.accuracy}%`} />
        {/* like the original, the time card only shows up when you were fast */}
        {quick && (
          <StatCard label="Quick" color="var(--color-blue)" icon={<span className="text-xl">⏱</span>} value={formatDuration(result.duration_seconds)} />
        )}
      </div>
      {result.daily_goal_reached_now && (
        <p className="rounded-full bg-gold-light px-4 py-2 font-extrabold text-[#b57f00]">🎉 Daily goal reached: {result.daily_goal_xp} XP!</p>
      )}
      {result.skill_completed_now && (
        <p className="rounded-full bg-gold-light px-4 py-2 font-extrabold text-[#b57f00]">👑 Skill complete! You earned a crown.</p>
      )}
    </>
  );
}

function StatCard({ label, color, icon, value }: { label: string; color: string; icon: ReactNode; value: ReactNode }) {
  return (
    <div className="w-[104px] overflow-hidden rounded-2xl border-2 sm:w-[140px]" style={{ borderColor: color, background: color }}>
      <p className="py-1 text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--on-color)" }}>{label}</p>
      <div className="flex items-center justify-center gap-1.5 rounded-xl bg-bg py-3 text-xl font-black" style={{ color }}>
        {icon}
        {value}
      </div>
    </div>
  );
}

/**
 * Streak screen, modelled on the original: a headline, the mascot by a
 * campfire, and a week strip that looks *forward* (today checked, tomorrow
 * dashed) with a reminder that skipping a day resets the streak.
 */
function StreakScreen({ result, me }: { result: Completion; me: Me | undefined }) {
  const count = useCountUp(result.streak.current, 700);
  const streak = result.streak.current;
  const today = me?.week.at(-1)?.date;
  const xpByDay = new Map(me?.week.map((d) => [d.date, d.xp]) ?? []);
  // Show the current run (up to 5 past days), today, then upcoming days to fill a week.
  const past = Math.min(streak - 1, 5);
  const days = today ? Array.from({ length: 7 }, (_, i) => addDays(today, i - past)) : [];

  return (
    <>
      {streak === 1 ? (
        <h1 className="text-2xl font-extrabold text-ink-strong">Come back tomorrow for streak day 2!</h1>
      ) : (
        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-black text-orange">{Math.max(result.streak.previous, count)}</span>
          <span className="text-3xl font-black text-orange">day streak!</span>
        </div>
      )}
      <div className="flex items-end gap-1">
        <Mascot mood="cheer" size={150} />
        <div className="relative -ml-4 flex flex-col items-center">
          <FlameIcon size={96} />
          <span className="-mt-3 flex">
            <span className="h-5 w-16 rotate-12 rounded-full bg-[#a9663c]" />
            <span className="-ml-10 h-5 w-16 -rotate-12 rounded-full bg-[#8a4f2c]" />
          </span>
        </div>
      </div>
      {today && (
        <div className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-line">
          <div className="flex justify-between px-5 py-4">
            {days.map((day) => {
              const isToday = day === today;
              const done = day <= today && (xpByDay.get(day) ?? 0) > 0;
              const isTomorrow = day === addDays(today, 1);
              return (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className={`text-sm font-extrabold ${isToday ? "text-orange" : "text-ink-muted"}`}>{weekdayShort(day)}</span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      done ? "bg-orange text-white" : isTomorrow ? "border-2 border-dashed border-orange" : "bg-line"
                    }`}
                  >
                    {done && <CheckIcon size={18} />}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="border-t-2 border-line px-5 py-4 font-semibold text-ink">
            Tip: Skipping a day resets your streak. Don&apos;t forget tomorrow!
          </p>
        </div>
      )}
    </>
  );
}

function AchievementsScreen({ result }: { result: Completion }) {
  return (
    <>
      <h1 className="text-3xl font-black text-ink-strong">Achievement unlocked!</h1>
      <div className="flex flex-col gap-3">
        {result.achievements_unlocked.map((a) => {
          const Icon = ACHIEVEMENT_ICONS[a.icon] ?? ACHIEVEMENT_ICONS.crown;
          return (
            <div key={a.key} className="flex items-center gap-4 rounded-2xl border-2 border-line px-5 py-4 text-left">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-light">
                <Icon size={36} />
              </span>
              <div>
                <p className="text-lg font-extrabold text-ink-strong">{a.title}</p>
                <p className="font-semibold text-ink-muted">{a.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

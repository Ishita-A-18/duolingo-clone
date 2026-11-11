"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { mutate } from "swr";
import { api, ApiError } from "@/lib/api";
import { formatCountdown, weekdayShort } from "@/lib/format";
import { KEYS, useMe } from "@/lib/hooks";
import type { Me } from "@/lib/types";
import { BoltIcon, CheckIcon, FlameIcon, GemChip, GemIcon, HeartIcon, SpainFlag } from "../icons";
import { ProgressBar } from "../ui";
import { useToast } from "../Toasts";

/** Counts down from the server-provided seconds; refetches /me when a heart is due. */
export function useHeartCountdown(me: Me | undefined): number | null {
  const total = me?.next_heart_in_seconds ?? null;
  // Seconds elapsed since `total` was received (tagged so a refetch resets it).
  const [elapsed, setElapsed] = useState({ total, seconds: 0 });
  useEffect(() => {
    if (total == null) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed({ total, seconds });
      if (seconds >= total) {
        clearInterval(id);
        mutate(KEYS.me);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [total, me?.hearts]);
  if (total == null) return null;
  return Math.max(0, total - (elapsed.total === total ? elapsed.seconds : 0));
}

/** A stat button that opens a dropdown panel on click (works on touch too). */
function Stat({ trigger, label, children }: { trigger: ReactNode; label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref}>
      <button
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-[17px] font-extrabold hover:bg-bg-soft"
      >
        {trigger}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 animate-pop rounded-2xl border-2 border-line bg-bg p-5 shadow-xl max-md:fixed max-md:left-4 max-md:right-4 max-md:top-16">
          {children}
        </div>
      )}
    </div>
  );
}

export function StatsBar() {
  const { data: me } = useMe();
  const toast = useToast();
  const countdown = useHeartCountdown(me);
  if (!me) return <div className="h-11" />;

  const refill = async () => {
    try {
      await mutate(KEYS.me, api.refillHearts(), { revalidate: false });
      toast({ title: "Hearts refilled!", icon: <HeartIcon size={28} /> });
    } catch (e) {
      toast({ title: e instanceof ApiError ? e.message : "Couldn't refill.", tone: "error" });
    }
  };
  const full = me.hearts >= me.max_hearts;

  // `relative` here: each stat's dropdown anchors to the full bar width.
  return (
    <div className="relative flex items-center justify-between gap-1">
      <Stat label="Course" trigger={<SpainFlag size={32} />}>
        <p className="mb-3 text-sm font-extrabold uppercase tracking-wider text-ink-muted">My courses</p>
        <div className="flex items-center gap-3 rounded-xl border-2 border-blue-border bg-blue-light p-3">
          <SpainFlag size={36} />
          <span className="font-extrabold text-blue-dark">{me.course?.learning_language_name ?? "Spanish"}</span>
        </div>
        <p className="mt-3 text-sm text-ink-muted">More languages are coming soon.</p>
      </Stat>

      <Stat
        label="Streak"
        trigger={
          <>
            <FlameIcon size={28} muted={!me.streak_extended_today} />
            <span className={me.streak_extended_today ? "text-orange" : "text-gray"}>{me.streak}</span>
          </>
        }
      >
        <StreakPanel me={me} />
      </Stat>

      <Stat label="XP" trigger={<><BoltIcon size={28} /><span className="text-gold-dark">{me.total_xp}</span></>}>
        <h3 className="text-lg font-extrabold text-ink-strong">{me.total_xp} total XP</h3>
        <p className="mt-1 font-bold text-ink-muted">Daily goal: {Math.min(me.today_xp, me.daily_goal_xp)} / {me.daily_goal_xp} XP</p>
        <div className="mt-3">
          <ProgressBar value={me.today_xp / me.daily_goal_xp} color="var(--color-gold)" height={18} />
        </div>
        <p className="mt-3 text-sm font-semibold text-ink-muted">
          {me.today_xp >= me.daily_goal_xp ? "Daily goal complete. Nice work!" : "Complete lessons to reach your daily goal."}
        </p>
      </Stat>

      <Stat label="Gems" trigger={<><GemIcon size={28} /><span className="text-blue">{me.gems}</span></>}>
        <h3 className="text-lg font-extrabold text-ink-strong">Gems</h3>
        <p className="mt-1 text-ink-muted">You have {me.gems} gems. Spend them in the shop.</p>
        <Link href="/shop" className="btn btn-blue mt-4 w-full">Go to shop</Link>
      </Stat>

      <Stat label="Hearts" trigger={<><HeartIcon size={28} muted={me.hearts === 0} /><span className="text-red">{me.hearts}</span></>}>
        <h3 className="text-center text-lg font-extrabold text-ink-strong">Hearts</h3>
        <div className="my-3 flex justify-center gap-1">
          {Array.from({ length: me.max_hearts }, (_, i) => (
            <HeartIcon key={i} size={34} muted={i >= me.hearts} />
          ))}
        </div>
        <p className="text-center font-bold text-ink-muted">
          {full ? "You have full hearts" : countdown != null ? `Next heart in ${formatCountdown(countdown)}` : ""}
        </p>
        <button className="btn btn-blue mt-4 w-full" disabled={full || me.gems < me.heart_refill_cost} onClick={refill}>
          Refill hearts <GemChip /> {me.heart_refill_cost}
        </button>
        <Link href="/practice" className="btn btn-outline mt-3 w-full !text-green">
          Practice to earn hearts
        </Link>
      </Stat>
    </div>
  );
}

export function StreakPanel({ me }: { me: Me }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-black text-orange">{me.streak} day streak</p>
          <p className="mt-1 font-bold text-ink-muted">
            {me.streak_extended_today
              ? "You've extended your streak today!"
              : "Do a lesson today to extend your streak!"}
          </p>
        </div>
        <FlameIcon size={64} muted={!me.streak_extended_today} />
      </div>
      <div className="mt-4 flex justify-between rounded-2xl border-2 border-line p-3">
        {me.week.map((d, i) => {
          const isToday = i === me.week.length - 1;
          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <span className={`text-xs font-extrabold ${isToday ? "text-orange" : "text-ink-muted"}`}>
                {weekdayShort(d.date)}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  d.xp > 0 ? "bg-orange text-white" : "bg-line"
                }`}
              >
                {d.xp > 0 && <CheckIcon size={18} />}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { BoltIcon, ChestIcon, LockIcon, TreasureChest } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { ProgressBar } from "@/components/ui";
import { useMe } from "@/lib/hooks";

// Hours until quests refresh (local midnight). A tiny external store that ticks
// every minute keeps render pure and avoids hydration mismatches.
const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
};
const hoursUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((midnight.getTime() - now.getTime()) / 3_600_000));
};

export default function QuestsPage() {
  const { data: me } = useMe();
  const hours = useSyncExternalStore(subscribe, hoursUntilMidnight, () => null);

  return (
    <div className="flex flex-col gap-8">
      <section className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-[#9069cd] p-8">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-[#1f1147]">Welcome!</h1>
          <p className="mt-3 text-lg font-semibold text-[#1f1147]/85">Complete quests to earn rewards! Quests refresh every day.</p>
        </div>
        <div className="relative hidden shrink-0 sm:block">
          <span className="absolute -top-6 left-2 z-10"><TreasureChest state="available" size={64} /></span>
          <Mascot mood="cheer" size={130} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-ink-strong">Daily Quests</h2>
          {hours !== null && (
            <span className="flex items-center gap-1.5 font-extrabold uppercase text-orange">
              <span aria-hidden>◷</span> {hours} {hours === 1 ? "hour" : "hours"}
            </span>
          )}
        </div>

        {me && (
          <div className="flex items-center gap-5 rounded-2xl border-2 border-line p-6">
            <BoltIcon size={48} className="shrink-0" />
            <div className="flex-1">
              <p className="text-lg font-extrabold text-ink-strong">Earn {me.daily_goal_xp} XP</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative flex-1">
                  <ProgressBar value={me.today_xp / me.daily_goal_xp} color="var(--color-gold)" height={22} />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-ink-strong">
                    {Math.min(me.today_xp, me.daily_goal_xp)} / {me.daily_goal_xp}
                  </span>
                </div>
                <ChestIcon size={40} muted={me.today_xp < me.daily_goal_xp} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-5 rounded-2xl border-2 border-line bg-bg-soft p-6">
          <LockIcon size={44} className="shrink-0 text-locked-icon" />
          <p className="text-lg font-extrabold text-ink-muted">More quests unlock soon</p>
        </div>
      </section>
    </div>
  );
}

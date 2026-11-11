"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { ACHIEVEMENT_ICONS, BoltIcon, CrownIcon, FlameIcon, LeagueShield, MedalIcon, PencilIcon, SpainFlag } from "@/components/icons";
import { useToast } from "@/components/Toasts";
import { ErrorState, ProgressBar, Spinner } from "@/components/ui";
import { joinedLabel } from "@/lib/format";
import { useProfile } from "@/lib/hooks";
import type { Achievement } from "@/lib/types";

const ACHIEVEMENT_COLORS: Record<string, string> = {
  orange: "#ff9600",
  yellow: "#ffc800",
  blue: "#1cb0f6",
  red: "#ff4b4b",
  purple: "#ce82ff",
};

export default function ProfilePage() {
  const { data, error, mutate } = useProfile();
  const [showAll, setShowAll] = useState(false);
  const toast = useToast();
  if (error) return <ErrorState message={error.message} onRetry={() => mutate()} />;
  if (!data) return <Spinner />;
  const { me } = data;
  const friendsSoon = () => toast({ title: "Friends are coming soon!", tone: "info" });
  const achievements = showAll ? data.achievements : data.achievements.slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      {/* header banner with the avatar, as in the original */}
      <div className="relative flex h-56 items-end justify-center rounded-2xl bg-bg-soft">
        <div className="-mb-0 translate-y-0 pb-6">
          <Avatar name={me.display_name} color={me.avatar_color} size={136} />
        </div>
        <Link
          href="/settings"
          aria-label="Edit profile"
          className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-b-4 border-line bg-bg text-ink-strong hover:bg-bg-soft"
        >
          <PencilIcon size={22} />
        </Link>
      </div>

      <div className="flex items-end justify-between gap-4 border-b-2 border-line pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-strong">{me.display_name}</h1>
          <p className="text-lg font-semibold text-ink-muted">{me.username}</p>
          <p className="mt-3 font-semibold text-ink">Joined {joinedLabel(me.joined_at)}</p>
          <div className="mt-3 flex gap-6 font-extrabold text-blue">
            <button onClick={friendsSoon} className="hover:brightness-110">0 Following</button>
            <button onClick={friendsSoon} className="hover:brightness-110">0 Followers</button>
          </div>
        </div>
        <span title={`Learning ${me.course?.learning_language_name ?? "Spanish"}`}>
          <SpainFlag size={44} />
        </span>
      </div>

      {/* statistics */}
      <section>
        <h2 className="mb-4 text-2xl font-extrabold text-ink-strong">Statistics</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={<FlameIcon size={32} muted={me.streak === 0} />} value={me.streak} label="Day streak" muted={me.streak === 0} />
          <Stat icon={<BoltIcon size={32} />} value={me.total_xp} label="Total XP" />
          <Stat
            icon={data.league ? <LeagueShield tone="bronze" size={30} /> : <span className="opacity-50 grayscale"><LeagueShield tone="silver" size={30} /></span>}
            value={data.league ?? "None"}
            label={data.league_rank ? `Current league · #${data.league_rank}` : "Current league"}
            muted={!data.league}
          />
          <Stat icon={<MedalIcon size={32} muted={data.top3_finishes === 0} />} value={data.top3_finishes} label="Top 3 finishes" muted={data.top3_finishes === 0} />
        </div>
        <p className="mt-3 text-sm font-semibold text-ink-muted">
          {data.lessons_completed} lessons · {data.skills_completed}/{data.total_skills} skills ·{" "}
          <span className="inline-flex items-center gap-1 align-middle"><CrownIcon size={16} /> {data.crowns} crowns</span> · longest streak{" "}
          {me.longest_streak} days
        </p>
      </section>

      {/* achievements */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-ink-strong">Achievements</h2>
          <button onClick={() => setShowAll((v) => !v)} className="font-extrabold uppercase tracking-wide text-blue hover:brightness-110">
            {showAll ? "Show less" : "View all"}
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl border-2 border-line">
          {achievements.map((a, i) => (
            <AchievementRow key={a.metric} a={a} last={i === achievements.length - 1} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, value, label, muted }: { icon: ReactNode; value: ReactNode; label: string; muted?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-line px-5 py-4">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className={`truncate text-xl font-extrabold ${muted ? "text-ink-muted" : "text-ink-strong"}`}>{value}</p>
        <p className="truncate text-sm font-semibold text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

function AchievementRow({ a, last }: { a: Achievement; last: boolean }) {
  const Icon = ACHIEVEMENT_ICONS[a.icon] ?? ACHIEVEMENT_ICONS.crown;
  const color = ACHIEVEMENT_COLORS[a.color] ?? "#ffc800";
  const maxed = a.next_threshold === null;

  return (
    <div className={`flex items-center gap-4 p-4 ${last ? "" : "border-b-2 border-line"}`}>
      <div
        className="relative flex h-[96px] w-[84px] shrink-0 flex-col items-center justify-center rounded-2xl"
        style={{ background: color, boxShadow: `0 4px 0 rgba(0,0,0,.15)` }}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95">
          <Icon size={32} />
        </span>
        <span className="mt-1 text-xs font-black uppercase text-black/60">Level {maxed ? a.max_level : a.level + 1}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-extrabold text-ink-strong">{a.title}</h3>
          <span className="text-sm font-bold text-ink-muted">
            {maxed ? "Max level" : `${a.value}/${a.next_threshold}`}
          </span>
        </div>
        <div className="my-2">
          <ProgressBar value={maxed ? 1 : a.value / (a.next_threshold ?? 1)} color="var(--color-gold)" height={14} />
        </div>
        <p className="font-semibold text-ink-muted">{a.description}</p>
      </div>
    </div>
  );
}

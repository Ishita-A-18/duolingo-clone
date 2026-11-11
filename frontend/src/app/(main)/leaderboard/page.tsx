"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { LeagueShield } from "@/components/icons";
import { ErrorState, Spinner } from "@/components/ui";
import { useLeaderboard, usePath } from "@/lib/hooks";

const MEDALS = ["#ffc800", "#c0c0c0", "#cd7f32"];

export default function LeaderboardPage() {
  const { data, error, mutate } = useLeaderboard();
  if (error) return <ErrorState message={error.message} onRetry={() => mutate()} />;
  if (!data) return <Spinner />;
  if (!data.unlocked) return <LockedLeague lessonsLeft={data.lessons_to_unlock} />;

  return (
    <div>
      <div className="flex flex-col items-center border-b-2 border-line pb-6 text-center">
        {/* current league in front, the next leagues up dimmed behind it */}
        <div className="flex items-end gap-2">
          <LeagueShield tone="bronze" size={84} />
          <span className="opacity-35"><LeagueShield tone="silver" size={56} /></span>
          <span className="opacity-35"><LeagueShield tone="gold" size={56} /></span>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-ink-strong">{data.league} League</h1>
        <p className="mt-1 font-semibold text-ink-muted">Top {data.promotion_zone} advance to the next league</p>
        <p className="mt-1 font-extrabold text-orange">
          {data.days_left === 0 ? "Ends today" : `${data.days_left} day${data.days_left === 1 ? "" : "s"} left`}
        </p>
      </div>

      <ol className="mt-2">
        {data.standings.map((s, i) => (
          <li key={s.user_id}>
            {i === data.promotion_zone && (
              <p className="my-2 flex items-center gap-3 text-sm font-extrabold uppercase tracking-wider text-green">
                <span className="h-0.5 flex-1 bg-green" /> Promotion zone <span className="h-0.5 flex-1 bg-green" />
              </p>
            )}
            <div
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 ${s.is_me ? "border-2 border-blue-border bg-blue-light" : "hover:bg-bg-soft"}`}
            >
              <span
                className="flex w-8 justify-center text-lg font-black"
                style={{ color: i < 3 ? MEDALS[i] : i < data.promotion_zone ? "var(--color-green)" : "var(--text-muted)" }}
              >
                {s.rank}
              </span>
              <Avatar name={s.display_name} color={s.avatar_color} />
              <span className={`flex-1 font-extrabold ${s.is_me ? "text-blue-dark" : "text-ink-strong"}`}>
                {s.display_name} {s.is_me && "(you)"}
              </span>
              <span className="font-bold text-ink-muted">{s.weekly_xp} XP</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * New learners see a teaser until they've finished a few lessons, like the
 * original: league shields, a nudge, and placeholder rows instead of names.
 */
function LockedLeague({ lessonsLeft }: { lessonsLeft: number }) {
  const { data: path } = usePath();
  const active = path?.units.flatMap((u) => u.skills).find((s) => s.state === "active");
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex items-center pt-4">
        <span className="absolute left-[30%] top-0 h-3.5 w-3.5 rotate-45 rounded-sm bg-gold-light ring-2 ring-gold/60" />
        <span className="-mr-6 translate-y-2"><LeagueShield tone="bronze" size={96} tilt={-14} /></span>
        <span className="relative z-10"><LeagueShield tone="gold" size={128} /></span>
        <span className="-ml-6 translate-y-2"><LeagueShield tone="silver" size={96} tilt={14} /></span>
        <span className="absolute bottom-0 left-[55%] h-3.5 w-3.5 rotate-45 rounded-sm bg-gold-light ring-2 ring-gold/60" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold text-ink-strong">Unlock Leaderboards!</h1>
      <p className="mt-3 text-lg font-semibold text-ink">
        Complete {lessonsLeft} more lesson{lessonsLeft === 1 ? "" : "s"} to start competing
      </p>
      <Link href={active ? `/lesson/${active.id}` : "/learn"} className="btn btn-outline mt-6 w-full max-w-xs !text-blue">
        Start a lesson
      </Link>

      {/* placeholder league rows */}
      <ol className="mt-10 flex w-full flex-col gap-7" aria-hidden>
        {[44, 70, 36, 96, 52].map((w, i) => (
          <li key={i} className="flex items-center gap-5 px-4" style={{ opacity: 1 - i * 0.18 }}>
            <span className="h-5 w-5 rounded-full bg-line" />
            <span className="h-14 w-14 rounded-full bg-line" />
            <span className="h-4 rounded-full bg-line" style={{ width: w * 1.6 }} />
            <span className="ml-auto h-4 w-16 rounded-full bg-line" />
          </li>
        ))}
      </ol>
    </div>
  );
}

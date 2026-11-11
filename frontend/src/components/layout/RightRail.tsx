"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLeaderboard, useMe, usePath } from "@/lib/hooks";
import { BoltIcon, ChestIcon, LeagueShield, ShieldIcon } from "../icons";
import { Mascot } from "../Mascot";
import { useToast } from "../Toasts";
import { Card, ProgressBar } from "../ui";
import { StatsBar } from "./StatsBar";

/**
 * Desktop right column. The stats bar is always on top (the brief requires it
 * on every screen); the cards below depend on the page, mirroring the original:
 *   learn        -> Super promo, league, daily quests
 *   leaderboard  -> what leaderboards are
 *   quests       -> monthly challenge teaser
 *   shop         -> league, daily quests (the page itself promotes Super)
 *   profile      -> friends + add friends
 *   settings     -> account / subscription / support links
 */
function railCards(pathname: string) {
  if (pathname.startsWith("/leaderboard")) return <LeaderboardInfoCard />;
  if (pathname.startsWith("/quests")) return <MonthlyChallengeCard />;
  if (pathname.startsWith("/shop")) return (<><LeagueCard /><DailyGoalCard /></>);
  if (pathname.startsWith("/profile")) return (<><FriendsCard /><AddFriendsCard /></>);
  if (pathname.startsWith("/settings")) return <SettingsNavCards />;
  return (<><SuperCard /><LeagueCard /><DailyGoalCard /></>);
}

export function RightRail() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-[368px] shrink-0 flex-col gap-6 overflow-y-auto py-6 no-scrollbar lg:flex">
      <StatsBar />
      {railCards(pathname)}
      <footer className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 text-xs font-extrabold uppercase text-gray">
        <span>About</span>
        <Link href="/help" className="hover:text-ink-muted">Help</Link>
        <span>Terms</span>
        <span>Privacy</span>
      </footer>
    </aside>
  );
}

/** Starts the learner's current lesson (or falls back to the path). */
function StartLessonButton() {
  const { data: path } = usePath();
  const active = path?.units.flatMap((u) => u.skills).find((s) => s.state === "active");
  return (
    <Link href={active ? `/lesson/${active.id}` : "/learn"} className="btn btn-outline mt-5 w-full !text-blue">
      Start a lesson
    </Link>
  );
}

/** Settings navigation, as in the original. Links to pages this demo has go there; the rest are placeholders. */
function SettingsNavCards() {
  const toast = useToast();
  const soon = (title: string) => () => toast({ title: `${title} is coming soon`, tone: "info" });
  const link = "block py-2.5 text-lg font-bold text-ink-strong hover:text-blue";
  return (
    <>
      <Card className="!px-8 !py-6">
        <h3 className="mb-3 text-2xl font-extrabold text-ink-strong">Account</h3>
        <Link href="/settings" className={`${link} !text-blue`}>Preferences</Link>
        <Link href="/profile" className={link}>Profile</Link>
        {["Notifications", "Courses", "Social accounts", "Privacy settings"].map((t) => (
          <button key={t} className={`${link} w-full text-left`} onClick={soon(t)}>{t}</button>
        ))}
      </Card>
      <Card className="!px-8 !py-6">
        <h3 className="mb-3 text-2xl font-extrabold text-ink-strong">Subscription</h3>
        <Link href="/shop" className={link}>Choose a plan</Link>
      </Card>
      <Card className="!px-8 !py-6">
        <h3 className="mb-3 text-2xl font-extrabold text-ink-strong">Support</h3>
        <Link href="/help" className={link}>Help Center</Link>
      </Card>
    </>
  );
}

function MonthlyChallengeCard() {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-extrabold leading-snug text-ink-strong">Monthly challenges unlock soon!</h3>
          <p className="mt-3 font-semibold text-ink">Complete each month&apos;s challenge to earn exclusive badges</p>
        </div>
        {/* coin badge */}
        <span className="-mr-8 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[6px] border-gold-dark bg-gold">
          <BoltIcon size={44} />
        </span>
      </div>
      <StartLessonButton />
    </Card>
  );
}

function FriendsCard() {
  const toast = useToast();
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex border-b-2 border-line text-center text-[15px] font-extrabold uppercase tracking-wide">
        <button className="flex-1 border-b-2 border-blue py-4 uppercase text-blue" style={{ marginBottom: -2 }}>Following</button>
        <button className="flex-1 py-4 uppercase text-ink-strong" onClick={() => toast({ title: "Friends are coming soon!", tone: "info" })}>
          Followers
        </button>
      </div>
      <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
        <div className="flex items-end -space-x-5">
          <Mascot mood="wave" size={70} />
          <Mascot mood="cheer" size={90} />
          <Mascot mood="happy" size={70} />
        </div>
        <p className="text-lg font-semibold text-ink">Learning is more fun and effective when you connect with others.</p>
      </div>
    </Card>
  );
}

function AddFriendsCard() {
  const toast = useToast();
  const soon = () => toast({ title: "Friends are coming soon!", body: "Social features aren't part of this demo yet.", tone: "info" });
  return (
    <Card>
      <h3 className="text-lg font-extrabold text-ink-strong">Add friends</h3>
      {[
        { label: "Find friends", icon: "🔍" },
        { label: "Invite friends", icon: "💌" },
      ].map((row) => (
        <button key={row.label} onClick={soon} className="mt-3 flex w-full items-center gap-4 rounded-xl py-2 text-left hover:bg-bg-soft">
          <span className="text-3xl">{row.icon}</span>
          <span className="flex-1 font-extrabold text-ink-strong">{row.label}</span>
          <span className="text-xl font-black text-ink-muted">›</span>
        </button>
      ))}
    </Card>
  );
}

function LeaderboardInfoCard() {
  return (
    <Card className="relative overflow-hidden">
      <p className="text-sm font-extrabold uppercase tracking-wide text-ink-muted">What are leaderboards?</p>
      <div className="mt-3 flex items-start gap-2">
        <div className="flex-1">
          <h3 className="text-lg font-extrabold leading-snug text-ink-strong">Do lessons. Earn XP. Compete.</h3>
          <p className="mt-2 font-semibold text-ink">Earn XP through lessons, then compete with players in a weekly leaderboard.</p>
        </div>
        <Mascot mood="cheer" size={84} className="-mr-6 shrink-0" />
      </div>
    </Card>
  );
}

function LeagueCard() {
  const { data } = useLeaderboard();
  const me = data?.standings.find((s) => s.is_me);
  if (!data) return null; // still loading: don't show a misleading placeholder
  if (!data.unlocked) {
    return (
      <Card>
        <h3 className="text-xl font-extrabold text-ink-strong">Unlock Leaderboards!</h3>
        <div className="mt-4 flex items-center gap-4">
          <span className="shrink-0 opacity-60 grayscale"><LeagueShield tone="silver" size={52} /></span>
          <p className="font-bold text-ink-muted">
            Complete {data.lessons_to_unlock} more lesson{data.lessons_to_unlock === 1 ? "" : "s"} to start competing
          </p>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-ink-strong">{data?.league ?? "Bronze"} League</h3>
        <Link href="/leaderboard" className="text-sm font-extrabold uppercase tracking-wide text-blue hover:brightness-110">
          View league
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <ShieldIcon size={52} className="shrink-0" />
        <p className="font-bold text-ink-muted">
          {me ? (
            <>
              You&apos;re ranked <span className="text-ink-strong">#{me.rank}</span> with{" "}
              <span className="text-ink-strong">{me.weekly_xp} XP</span> this week.
              {data && me.rank > data.promotion_zone && " Earn more XP to reach the promotion zone!"}
            </>
          ) : (
            "Complete a lesson to join this week's league."
          )}
        </p>
      </div>
    </Card>
  );
}

export function DailyGoalCard() {
  const { data: me } = useMe();
  if (!me) return null;
  const done = me.today_xp >= me.daily_goal_xp;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-ink-strong">Daily Quests</h3>
        <Link href="/quests" className="text-sm font-extrabold uppercase tracking-wide text-blue hover:brightness-110">
          View all
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <BoltIcon size={44} className="shrink-0" />
        <div className="flex-1">
          <p className="font-extrabold text-ink-strong">Earn {me.daily_goal_xp} XP</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <ProgressBar value={me.today_xp / me.daily_goal_xp} color="var(--color-gold)" height={18} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-ink-strong">
                {Math.min(me.today_xp, me.daily_goal_xp)} / {me.daily_goal_xp}
              </span>
            </div>
            <ChestIcon size={32} muted={!done} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function SuperCard() {
  const toast = useToast();
  return (
    <Card className="relative overflow-hidden">
      <span className="rounded-lg bg-linear-to-r from-[#26ff55] via-[#00c2ff] to-[#9d4dff] px-2 py-0.5 text-xs font-black uppercase text-white">
        Super
      </span>
      <div className="mt-3 flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-extrabold text-ink-strong">Try Super for free</h3>
          <p className="mt-1 text-sm font-semibold text-ink-muted">No ads, unlimited hearts and personalized practice.</p>
        </div>
        <Mascot mood="wave" size={72} />
      </div>
      <button
        className="btn mt-4 w-full"
        style={{ "--btn-bg": "#4b4bff", "--btn-edge": "#3434c2", "--btn-fg": "#fff" } as React.CSSProperties}
        onClick={() => toast({ title: "Super is coming soon", body: "Subscriptions aren't part of this demo.", tone: "info" })}
      >
        Start my free month
      </button>
    </Card>
  );
}

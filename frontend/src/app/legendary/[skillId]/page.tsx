"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { BoltIcon, CloseIcon, GemIcon, TrophyIcon } from "@/components/icons";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useMe, usePath } from "@/lib/hooks";

/**
 * Legendary challenge: an intro screen with the rules and price first (so gems
 * are never spent by accident), then the timed lesson itself.
 */
export default function LegendaryPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const [started, setStarted] = useState(false);
  const start = useCallback(() => api.startLegendary(Number(skillId)), [skillId]);

  if (started) return <LessonPlayer start={start} />;
  return <LegendaryIntro skillId={Number(skillId)} onStart={() => setStarted(true)} />;
}

function LegendaryIntro({ skillId, onStart }: { skillId: number; onStart: () => void }) {
  const { data: path } = usePath();
  const { data: me } = useMe();
  if (!path || !me) return <div className="pt-40"><Spinner /></div>;

  const rules = path.legendary;
  const skill = path.units.flatMap((u) => u.skills).find((s) => s.id === skillId);
  const canAfford = me.gems >= rules.gem_cost;
  const unlocked = skill?.state === "completed";
  const minutes = Math.round(rules.seconds / 60);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-[1000px] px-4 pt-6 sm:px-10 sm:pt-12">
        <Link href="/learn" aria-label="Close" className="text-gray hover:text-ink-muted"><CloseIcon size={28} /></Link>
      </header>

      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center gap-6 px-4 py-8 text-center">
        <span className="flex h-36 w-36 animate-pop items-center justify-center rounded-full bg-gold-light">
          <TrophyIcon size={96} />
        </span>
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-gold-dark">Legendary challenge</p>
          <h1 className="mt-1 text-3xl font-extrabold text-ink-strong">{skill?.title ?? "Skill"}</h1>
        </div>
        <ul className="w-full overflow-hidden rounded-2xl border-2 border-line text-left">
          <Rule icon={<span className="text-2xl">❓</span>} text={`${rules.questions} questions from the whole skill`} />
          <Rule icon={<span className="text-2xl">⏱</span>} text={`${minutes} minutes on the clock`} />
          <Rule icon={<span className="text-2xl">✖</span>} text={`Up to ${rules.mistakes_allowed} mistakes. One more and the challenge ends`} />
          <Rule icon={<BoltIcon size={26} />} text={`Win +${rules.xp} XP and turn this skill gold`} last />
        </ul>
        {!unlocked && <p className="font-bold text-red">Finish this skill first to unlock its Legendary challenge.</p>}
        {unlocked && !canAfford && <p className="font-bold text-red">You need {rules.gem_cost} gems. You have {me.gems}.</p>}
      </main>

      <footer className="border-t-2 border-line">
        <div className="mx-auto flex min-h-[140px] max-w-[1000px] flex-col-reverse justify-center gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <Link href="/learn" className="btn btn-outline w-full sm:w-[180px]">Not now</Link>
          <button className="btn btn-gold w-full sm:w-[220px]" disabled={!unlocked || !canAfford} onClick={onStart}>
            Start for <GemIcon size={20} /> {rules.gem_cost}
          </button>
        </div>
      </footer>
    </div>
  );
}

function Rule({ icon, text, last }: { icon: ReactNode; text: string; last?: boolean }) {
  return (
    <li className={`flex items-center gap-4 px-5 py-4 font-bold text-ink-strong ${last ? "" : "border-b-2 border-line"}`}>
      <span className="flex w-8 justify-center">{icon}</span>
      {text}
    </li>
  );
}

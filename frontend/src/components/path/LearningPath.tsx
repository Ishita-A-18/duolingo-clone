"use client";

import { useEffect, useRef, useState } from "react";
import { mutate } from "swr";
import { api } from "@/lib/api";
import { KEYS, useMe } from "@/lib/hooks";
import { playSound } from "@/lib/sound";
import { unitTheme } from "@/lib/theme";
import type { LearningPath as Path, Skill, Unit } from "@/lib/types";
import { ArrowLeftIcon, NotebookIcon, TreasureChest, TrophyIcon } from "../icons";
import { Mascot } from "../Mascot";
import { GemReward } from "../Reward";
import { useToast } from "../Toasts";
import { Modal } from "../ui";
import { NODE_BOX, NodePopover, PracticeNode, SkillNode, skillPopoverCopy } from "./SkillNode";

// Horizontal offsets (px) that make the path snake left and right.
const SNAKE = [0, 44, 70, 44, 0, -44, -70, -44];

/** Everything that can sit on the path, in display order. */
type PathItem =
  | { kind: "skill"; skill: Skill }
  | { kind: "chest" }
  | { kind: "practice" }
  | { kind: "trophy" };

/**
 * Unit layout: its skills, with the treasure chest after `chest.after_skill`,
 * a personalized-practice node after the last skill, and the unit trophy.
 * That gives ~6 stops per unit, like the original path.
 */
export function unitItems(unit: Unit): PathItem[] {
  const items: PathItem[] = [];
  unit.skills.forEach((skill, i) => {
    items.push({ kind: "skill", skill });
    if (i === unit.chest.after_skill) items.push({ kind: "chest" });
  });
  items.push({ kind: "practice" }, { kind: "trophy" });
  return items;
}

export function LearningPath({ path }: { path: Path }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [activeVisible, setActiveVisible] = useState(true);
  const activeRef = useRef<HTMLDivElement>(null);

  // Bring the learner's current node into view on load, and watch whether
  // it's on screen to show the floating "jump back" button.
  useEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    const io = new IntersectionObserver(([entry]) => setActiveVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (openKey === null) return;
    const close = () => setOpenKey(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openKey]);

  return (
    <div className="flex flex-col gap-10">
      {path.units.map((unit, u) => (
        <UnitSection
          key={unit.id}
          unit={unit}
          flip={u % 2 === 1}
          openKey={openKey}
          setOpenKey={setOpenKey}
          activeRef={activeRef}
        />
      ))}
      {!activeVisible && (
        <button
          aria-label="Jump to current lesson"
          onClick={() => activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 animate-pop items-center justify-center rounded-2xl border-2 border-b-4 border-line bg-bg text-blue md:bottom-8 lg:right-[420px]"
        >
          <ArrowLeftIcon size={26} className="rotate-90" />
        </button>
      )}
    </div>
  );
}

function UnitSection({ unit, flip, openKey, setOpenKey, activeRef }: {
  unit: Unit;
  flip: boolean;
  openKey: string | null;
  setOpenKey: (k: string | null) => void;
  activeRef: React.RefObject<HTMLDivElement | null>;
}) {
  const theme = unitTheme(unit.color);
  const toast = useToast();
  const { data: me } = useMe();
  const [reward, setReward] = useState<number | null>(null);
  const items = unitItems(unit);
  const offset = (i: number) => SNAKE[i % SNAKE.length] * (flip ? -1 : 1);
  const unitLocked = unit.state === "locked";
  const toggle = (key: string) => setOpenKey(openKey === key ? null : key);

  const openChest = async () => {
    if (unit.chest.state === "locked") {
      toast({ title: "Chest locked", body: "Complete the levels above to open this chest.", tone: "info", icon: <TreasureChest state="locked" size={36} /> });
      return;
    }
    if (unit.chest.state === "claimed") {
      toast({ title: "Already opened", body: "You collected this chest's gems.", tone: "info" });
      return;
    }
    try {
      const res = await api.claimChest(unit.id);
      setReward(res.gems_earned);
      playSound("complete", me?.sound_enabled ?? true);
      mutate(KEYS.path);
      mutate(KEYS.me);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Couldn't open the chest", tone: "error" });
    }
  };

  const render = (item: PathItem) => {
    switch (item.kind) {
      case "skill": {
        const key = `skill-${item.skill.id}`;
        const copy = skillPopoverCopy(item.skill);
        return (
          <>
            <SkillNode skill={item.skill} theme={theme} open={openKey === key} onToggle={() => toggle(key)} />
            {openKey === key && (
              <NodePopover
                theme={theme}
                locked={item.skill.state === "locked"}
                title={copy.title}
                body={copy.body}
                action={copy.label ? { href: `/lesson/${item.skill.id}`, label: copy.label, onClick: () => setOpenKey(null) } : undefined}
              />
            )}
          </>
        );
      }
      case "practice": {
        const key = `practice-${unit.id}`;
        return (
          <>
            <PracticeNode locked={unitLocked} theme={theme} open={openKey === key} onToggle={() => toggle(key)} />
            {openKey === key && (
              <NodePopover
                theme={theme}
                locked={unitLocked}
                title="Personalized practice"
                body={unitLocked ? "Complete all levels above to unlock this!" : "Review what you've learned. No hearts at risk, and you earn one back!"}
                action={{ href: "/practice", label: "Practice +5 XP", onClick: () => setOpenKey(null) }}
              />
            )}
          </>
        );
      }
      case "chest":
        return (
          <button
            onClick={openChest}
            aria-label={`Treasure chest (${unit.chest.state})`}
            className={`flex h-full w-full items-center justify-center transition-transform active:scale-95 ${unit.chest.state === "available" ? "animate-bounce-chest" : ""}`}
          >
            <TreasureChest state={unit.chest.state === "claimed" ? "open" : unit.chest.state} size={76} />
          </button>
        );
      case "trophy":
        return (
          <button
            className="flex h-full w-full items-center justify-center"
            aria-label="Unit trophy"
            onClick={() =>
              toast({
                title: unit.state === "completed" ? "Unit complete!" : "Unit trophy",
                body: unit.state === "completed" ? "You conquered this unit." : "Finish every level in this unit to earn it.",
                icon: <TrophyIcon size={30} muted={unit.state !== "completed"} />,
                tone: unit.state === "completed" ? "gold" : "info",
              })
            }
          >
            <TrophyIcon size={72} muted={unit.state !== "completed"} />
          </button>
        );
    }
  };

  return (
    <section>
      <UnitBanner unit={unit} />
      <div className="relative mt-12 flex flex-col items-center gap-9">
        {items.map((item, i) => {
          const key = item.kind === "skill" ? `skill-${item.skill.id}` : `${item.kind}-${unit.id}`;
          const isActive = item.kind === "skill" && item.skill.state === "active";
          return (
            <div
              key={key}
              ref={isActive ? activeRef : undefined}
              className="relative"
              style={{ width: NODE_BOX, height: NODE_BOX, transform: `translateX(${offset(i)}px)`, zIndex: openKey === key ? 20 : 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              {render(item)}
            </div>
          );
        })}

        {/* Mascot standing beside the path, on its own little shadow */}
        <div className={`pointer-events-none absolute top-36 hidden flex-col items-center sm:flex ${flip ? "right-4" : "left-4"}`}>
          <Mascot mood={unitLocked ? "think" : "wave"} size={120} className={unitLocked ? "opacity-50 grayscale" : ""} />
          <span className="-mt-5 h-6 w-28 rounded-[50%] bg-line" />
        </div>
      </div>

      <Modal open={reward !== null} onClose={() => setReward(null)}>
        <GemReward gems={reward ?? 0} message="Nice work! Keep going to find more chests." />
        <button className="btn mt-6 w-full" onClick={() => setReward(null)}>Continue</button>
      </Modal>
    </section>
  );
}

function UnitBanner({ unit }: { unit: Unit }) {
  const theme = unitTheme(unit.color);
  const toast = useToast();
  const locked = unit.state === "locked";
  const bg = locked ? "var(--color-locked)" : theme.main;
  const edge = locked ? "var(--color-locked-dark)" : theme.dark;
  const fg = locked ? "text-ink-muted" : "text-white";
  return (
    <div
      className={`sticky top-[62px] z-10 flex items-center gap-3 rounded-2xl px-4 py-3 lg:top-6 ${fg}`}
      style={{ background: bg }}
    >
      <div className="min-w-0 flex-1">
        <button
          className="flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-wide opacity-80 hover:opacity-100"
          onClick={() => toast({ title: "Course sections", body: "The section overview is coming soon.", tone: "info" })}
        >
          <ArrowLeftIcon size={18} />
          Section {unit.section}, Unit {unit.position}
        </button>
        <h2 className="mt-0.5 truncate text-[22px] font-extrabold leading-tight">{unit.title}</h2>
      </div>
      <button
        className="flex shrink-0 items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-[15px] font-extrabold uppercase tracking-wide transition-transform active:translate-y-0.5 sm:px-4"
        style={{ borderColor: edge, boxShadow: `0 3px 0 ${edge}` }}
        title={unit.description}
        onClick={(e) => {
          e.stopPropagation();
          toast({ title: `Guidebook: ${unit.title}`, body: `${unit.description}. Full guidebooks are coming soon!`, tone: "info" });
        }}
      >
        <NotebookIcon size={24} />
        <span className="hidden sm:inline">Guidebook</span>
      </button>
    </div>
  );
}

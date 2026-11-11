"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { UnitTheme } from "@/lib/theme";
import type { Skill } from "@/lib/types";
import { CheckIcon, CrownIcon, DumbbellIcon, StarIcon } from "../icons";

const NODE_W = 70;
const NODE_H = 62;
export const NODE_BOX = 96; // every path item sits in a 96px box so the rhythm stays even

/** Circular progress ring drawn around the active node. */
function ProgressRing({ value, color }: { value: number; color: string }) {
  const r = NODE_BOX / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <svg width={NODE_BOX} height={NODE_BOX} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[calc(50%-4px)] -rotate-90">
      <circle cx={NODE_BOX / 2} cy={NODE_BOX / 2} r={r} stroke="var(--line)" strokeWidth="9" fill="none" />
      <circle
        cx={NODE_BOX / 2}
        cy={NODE_BOX / 2}
        r={r}
        stroke={color}
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

/** The pressable 3D circle shared by lesson and practice nodes. */
function CircleNode({ locked, theme, icon, label, open, onToggle, children }: {
  locked: boolean;
  theme: UnitTheme;
  icon: ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode; // ring, bubble, badges
}) {
  const fill = locked ? "var(--color-locked)" : theme.main;
  const edge = locked ? "var(--color-locked-dark)" : theme.dark;
  return (
    <div className="relative" style={{ width: NODE_BOX, height: NODE_BOX }}>
      {children}
      <button
        onClick={onToggle}
        aria-label={label}
        aria-expanded={open}
        className="group absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] transition-transform active:translate-y-[calc(-50%+6px)]"
        style={{ width: NODE_W, height: NODE_H }}
      >
        <span
          className={`flex h-full w-full items-center justify-center rounded-[50%] transition-shadow group-active:!shadow-none ${locked ? "text-locked-icon" : "text-white"}`}
          style={{ background: fill, boxShadow: `0 8px 0 ${edge}` }}
        >
          {icon}
        </span>
      </button>
    </div>
  );
}

export function SkillNode({ skill, theme, open, onToggle }: {
  skill: Skill;
  theme: UnitTheme;
  open: boolean;
  onToggle: () => void;
}) {
  const { state } = skill;
  return (
    <CircleNode
      locked={state === "locked"}
      theme={theme}
      // Locked levels show the level's own icon greyed out, like the original.
      icon={state === "completed" ? <CheckIcon size={34} /> : <StarIcon size={34} />}
      label={`${skill.title} (${state})`}
      open={open}
      onToggle={onToggle}
    >
      {state === "active" && (
        <>
          <ProgressRing value={skill.lessons_completed / skill.total_lessons} color={theme.main} />
          <div
            className="absolute -top-10 left-1/2 z-10 animate-bounce-soft whitespace-nowrap rounded-xl border-2 border-line bg-bg px-3 py-2 text-[15px] font-extrabold uppercase tracking-wide"
            style={{ color: theme.main }}
          >
            Start
            <span className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-line bg-bg" />
          </div>
        </>
      )}
      {/* Crown level, beside the node (the brief asks for crowns per skill). */}
      {state === "completed" && (
        <span className="absolute -right-3 top-1/2 z-[1] flex -translate-y-1/2 items-center rounded-full border-2 border-gold bg-bg py-0.5 pl-0.5 pr-2 text-sm font-black text-gold-dark">
          <CrownIcon size={20} />
          {skill.crowns}
        </span>
      )}
    </CircleNode>
  );
}

export function PracticeNode({ locked, theme, open, onToggle }: {
  locked: boolean;
  theme: UnitTheme;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <CircleNode
      locked={locked}
      theme={theme}
      icon={<DumbbellIcon size={34} />}
      label={`Personalized practice (${locked ? "locked" : "available"})`}
      open={open}
      onToggle={onToggle}
    />
  );
}

/** Popover under a node. Locked popovers are grey with a disabled button. */
export function NodePopover({ theme, locked, title, body, action }: {
  theme: UnitTheme;
  locked: boolean;
  title: string;
  body: string;
  action?: { href: string; label: string; onClick?: () => void };
}) {
  const bg = locked ? "var(--bg-soft)" : theme.main;
  const border = locked ? "2px solid var(--line)" : "none";
  return (
    <div
      className="absolute left-1/2 top-full z-30 mt-3 w-72 -translate-x-1/2 animate-pop rounded-2xl p-4 text-left"
      style={{ background: bg, border }}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45"
        style={{ background: bg, borderLeft: border, borderTop: border }}
      />
      <h3 className={`text-lg font-extrabold ${locked ? "text-ink-muted" : "text-white"}`}>{title}</h3>
      <p className={`mt-1 font-bold ${locked ? "text-ink-muted" : "text-white/85"}`}>{body}</p>
      {locked || !action ? (
        <button className="btn mt-4 w-full" disabled>Locked</button>
      ) : (
        <Link href={action.href} onClick={action.onClick} className="btn btn-white mt-4 w-full" style={{ color: theme.main }}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function skillPopoverCopy(skill: Skill) {
  if (skill.state === "locked") return { title: skill.title, body: "Complete all levels above to unlock this!" };
  if (skill.state === "completed")
    return {
      title: skill.title,
      body: `Crown level ${skill.crowns} of ${skill.max_crowns}. Review to level up!`,
      label: "Practice +5 XP",
    };
  return { title: skill.title, body: `Lesson ${skill.lessons_completed + 1} of ${skill.total_lessons}`, label: "Start +10 XP" };
}

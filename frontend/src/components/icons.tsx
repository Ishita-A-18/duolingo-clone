/**
 * Hand-drawn SVG icon set. Colored "sticker" icons (flame, gem, heart...) carry
 * their own palette; line icons use currentColor.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 24, ...rest }: P) => ({ width: size, height: size, ...rest });

export const FlameIcon = ({ muted, ...p }: P & { muted?: boolean }) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path
      d="M12 2.5c.6 3.2 4.9 5.4 6 9.2 1.3 4.6-2 9.3-6 9.3s-7.2-3.4-6.2-7.9c.4-2 1.6-3.4 2.6-4.3.2 1.6.9 2.7 1.8 3.1C9.6 8.6 10.6 5 12 2.5Z"
      style={{ fill: muted ? "var(--icon-muted)" : "#ff9600" }}
    />
    <path
      d="M12.2 12c.3 1.7 2.6 2.7 2.6 5 0 1.8-1.3 3.2-2.8 3.2s-2.9-1.3-2.7-3.1c.1-1.2.8-1.9 1.3-2.4.1.8.5 1.3 1 1.5-.1-1.4.1-2.9.6-4.2Z"
      style={{ fill: muted ? "var(--icon-muted-2)" : "#ffc800" }}
    />
  </svg>
);

export const GemIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M6.5 3.5h11L22 9l-10 12L2 9l4.5-5.5Z" fill="#1cb0f6" />
    <path d="M2 9h20L12 21 2 9Z" fill="#1899d6" />
    <path d="M7.5 9 12 21l4.5-12h-9Z" fill="#49c0f8" />
    <path d="M6.5 3.5 7.5 9 12 3.5h-5.5Z" fill="#84d8ff" />
  </svg>
);

export const HeartIcon = ({ muted, ...p }: P & { muted?: boolean }) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path
      d="M12 21s-8.5-5.2-9.6-10.6C1.6 6.6 4 3.5 7.3 3.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.3 0 5.7 3.1 4.9 6.9C20.5 15.8 12 21 12 21Z"
      style={{ fill: muted ? "var(--icon-muted)" : "#ff4b4b" }}
    />
    {!muted && <ellipse cx="7.6" cy="8" rx="2" ry="1.4" fill="#fff" opacity=".55" transform="rotate(-35 7.6 8)" />}
  </svg>
);

export const BoltIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M13.5 2 4.5 13.5h6L9.5 22l10-12.5h-6.5L13.5 2Z" fill="#ffc800" stroke="#e5a800" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

export const CrownIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M3 8.5 7.5 12 12 5l4.5 7L21 8.5 19 19H5L3 8.5Z" fill="#ffc800" stroke="#e5a800" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="12" cy="14.5" r="1.6" fill="#fff" opacity=".8" />
  </svg>
);

export const TrophyIcon = ({ muted, ...p }: P & { muted?: boolean }) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M7 3h10v6a5 5 0 0 1-10 0V3Z" style={{ fill: muted ? "var(--icon-muted-2)" : "#ffc800" }} />
    <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" style={{ stroke: muted ? "var(--icon-muted-2)" : "#ffc800" }} strokeWidth="2" fill="none" />
    <path d="M10.5 13.5h3V17h-3z" style={{ fill: muted ? "var(--locked-icon)" : "#e5a800" }} />
    <rect x="7" y="17" width="10" height="3.5" rx="1.2" style={{ fill: muted ? "var(--locked-icon)" : "#e5a800" }} />
  </svg>
);

export const ChestIcon = ({ muted, ...p }: P & { muted?: boolean }) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v1H3v-1Z" style={{ fill: muted ? "var(--icon-muted-2)" : "#ff9600" }} />
    <rect x="3" y="11" width="18" height="9" rx="2" style={{ fill: muted ? "var(--locked-icon)" : "#e08600" }} />
    <rect x="10" y="9" width="4" height="5" rx="1" style={{ fill: muted ? "var(--icon-muted)" : "#ffc800" }} />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.8Z" fill="currentColor" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const LockIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <rect x="5" y="10.5" width="14" height="10.5" rx="2.5" fill="currentColor" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="2.6" fill="none" />
  </svg>
);

export const SpeakerIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    <path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
  </svg>
);

export const DumbbellIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <rect x="2" y="9" width="3" height="6" rx="1" fill="currentColor" />
    <rect x="5" y="6.5" width="3.5" height="11" rx="1.2" fill="currentColor" />
    <rect x="8.5" y="10.8" width="7" height="2.4" fill="currentColor" />
    <rect x="15.5" y="6.5" width="3.5" height="11" rx="1.2" fill="currentColor" />
    <rect x="19" y="9" width="3" height="6" rx="1" fill="currentColor" />
  </svg>
);

export const BookIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.3-6-1.3-9 .7-3-2-6.5-2-9-.7V5.5Z" fill="currentColor" />
    <path d="M12 6v13.7" stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" />
  </svg>
);

export const TargetIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <circle cx="12" cy="12" r="9.5" fill="#ff4b4b" />
    <circle cx="12" cy="12" r="6.3" fill="#fff" />
    <circle cx="12" cy="12" r="3.2" fill="#ff4b4b" />
  </svg>
);

// ---- navigation (duotone line icons) -------------------------------------

export const HomeIcon = (p: P) => (
  <svg viewBox="0 0 32 32" {...base(p)}>
    <path d="M5 14 16 5l11 9v12a2 2 0 0 1-2 2h-6v-8h-6v8H7a2 2 0 0 1-2-2V14Z" fill="#ff9600" />
    <path d="M3 15 16 4.5 29 15" stroke="#e08600" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="13" y="20" width="6" height="8" rx="1" fill="#ffc800" />
  </svg>
);

export const ShieldIcon = (p: P) => (
  <svg viewBox="0 0 32 32" {...base(p)}>
    <path d="M16 3 27 7v8c0 7-5 12-11 14C10 27 5 22 5 15V7l11-4Z" fill="#ffc800" />
    <path d="M16 3v26C10 27 5 22 5 15V7l11-4Z" fill="#e5a800" />
    <path d="m16 10 2 4 4.4.6-3.2 3 .8 4.4-4-2.1-4 2.1.8-4.4-3.2-3 4.4-.6 2-4Z" fill="#fff" opacity=".9" />
  </svg>
);

export const QuestIcon = (p: P) => <ChestIcon {...p} />;

export const ShopIcon = (p: P) => (
  <svg viewBox="0 0 32 32" {...base(p)}>
    <rect x="5" y="13" width="22" height="15" rx="2" fill="#ce82ff" />
    <path d="M4 7h24l-2 7H6L4 7Z" fill="#ff4b4b" />
    <path d="M10 7v7M16 7v7M22 7v7" stroke="#fff" strokeWidth="1.6" opacity=".6" />
    <rect x="13" y="19" width="6" height="9" rx="1" fill="#a568cc" />
  </svg>
);

export const ProfileIcon = (p: P) => (
  <svg viewBox="0 0 32 32" {...base(p)}>
    <circle cx="16" cy="16" r="13" fill="#1cb0f6" />
    <circle cx="16" cy="13" r="5" fill="#fff" />
    <path d="M7.5 25.5c1.8-4 5-6 8.5-6s6.7 2 8.5 6A12.9 12.9 0 0 1 16 29c-3.3 0-6.3-1.3-8.5-3.5Z" fill="#fff" />
  </svg>
);

export const MoreIcon = (p: P) => (
  <svg viewBox="0 0 32 32" {...base(p)}>
    <circle cx="16" cy="16" r="13" fill="#afafaf" />
    <circle cx="10" cy="16" r="2.2" fill="#fff" />
    <circle cx="16" cy="16" r="2.2" fill="#fff" />
    <circle cx="22" cy="16" r="2.2" fill="#fff" />
  </svg>
);

export const NotebookIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <rect x="5" y="3" width="14" height="18" rx="2.5" fill="currentColor" />
    <path d="M9 8h6M9 12h6" stroke="#000" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Spanish flag, drawn as plain stripes (no coat of arms). */
export const SpainFlag = ({ size = 32, ...p }: P) => (
  <svg viewBox="0 0 32 24" width={size} height={(size * 3) / 4} {...p}>
    <rect width="32" height="24" rx="4" fill="#c60b1e" />
    <rect y="6" width="32" height="12" fill="#ffc400" />
    <rect width="32" height="24" rx="4" fill="none" stroke="#000" strokeOpacity=".12" strokeWidth="2" />
  </svg>
);

/** Icon used inside a path node, chosen by the skill's `icon` key. */
export function SkillGlyph({ icon, size = 34 }: { icon: string; size?: number }) {
  if (icon === "practice") return <DumbbellIcon size={size} />;
  if (icon === "story") return <BookIcon size={size} />;
  return <StarIcon size={size} />;
}

export const ACHIEVEMENT_ICONS: Record<string, (p: P) => React.ReactElement> = {
  flame: (p) => <FlameIcon {...p} />,
  bolt: (p) => <BoltIcon {...p} />,
  book: (p) => <BookIcon {...p} style={{ color: "#1cb0f6" }} />,
  target: (p) => <TargetIcon {...p} />,
  crown: (p) => <CrownIcon {...p} />,
};

/** Gem on a white chip, readable on top of blue buttons. */
export const GemChip = () => (
  <span className="inline-flex rounded-full bg-white p-0.5">
    <GemIcon size={18} />
  </span>
);

export const ArrowLeftIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" {...base(p)}>
    <path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FlagOutlineIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" {...base(p)}>
    <path d="M6 21V4h10l-2 4 2 4H6" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
);

export const MountainIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" {...base(p)}>
    <path d="m3 19 6.5-12 4 7 2-3L21 19H3Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
);

export const SparkleIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <circle cx="12" cy="12" r="11" fill="currentColor" />
    <path d="m12 5 1.6 4.4L18 11l-4.4 1.6L12 17l-1.6-4.4L6 11l4.4-1.6L12 5Z" fill="#fff" />
  </svg>
);

/**
 * Treasure chest drawn for this app. `state`:
 *   locked    -> slate silhouette (not reachable yet)
 *   available -> closed wooden chest with gold trim
 *   open      -> lid up, full of gems (reward screens / claimed chest)
 */
export function TreasureChest({ state, size = 72 }: { state: "locked" | "available" | "open"; size?: number }) {
  const locked = state === "locked";
  const wood = locked ? "var(--locked)" : "#b05a2d";
  const woodDark = locked ? "var(--locked-dark)" : "#8a4421";
  const trim = locked ? "var(--locked-icon)" : "#ffc800";
  const trimDark = locked ? "var(--locked-dark)" : "#e5a800";
  const open = state === "open";
  return (
    <svg viewBox="0 0 80 72" width={size} height={(size * 72) / 80} aria-hidden>
      <ellipse cx="40" cy="68" rx="30" ry="3.5" fill="var(--line)" />
      {open ? (
        <>
          <rect x="12" y="8" width="56" height="16" rx="5" fill={woodDark} />
          <rect x="10" y="4" width="60" height="6" rx="3" fill={trim} />
          <path d="m20 30 8-12 9 6 7-10 8 9 9-4 3 11H17Z" fill="#1cb0f6" />
          <path d="m28 18 9 6-6 6Zm16-4 8 9-8 3Z" fill="#84d8ff" />
        </>
      ) : (
        <path d="M12 30v-6a12 12 0 0 1 12-12h32a12 12 0 0 1 12 12v6Z" fill={wood} />
      )}
      <rect x="12" y="28" width="56" height="36" rx="4" fill={wood} />
      <rect x="12" y="40" width="56" height="4" fill={woodDark} />
      <rect x="12" y="28" width="9" height="36" rx="2" fill={trim} />
      <rect x="59" y="28" width="9" height="36" rx="2" fill={trim} />
      <rect x="33" y="33" width="14" height="17" rx="3" fill={trim} />
      <circle cx="40" cy="39" r="2.6" fill={trimDark} />
      <rect x="38.8" y="40" width="2.4" height="5.5" rx="1" fill={trimDark} />
    </svg>
  );
}

const SHIELD_TONES = {
  bronze: { face: "#d8a273", edge: "#b47c4f", shine: "#e8bf98" },
  gold: { face: "#ffc800", edge: "#e5a800", shine: "#ffe066" },
  silver: { face: "#d6e2ea", edge: "#a9bac6", shine: "#eef4f8" },
} as const;

/** League shield in bronze / gold / silver (drawn for this app). */
export function LeagueShield({ tone, size = 80, tilt = 0 }: { tone: keyof typeof SHIELD_TONES; size?: number; tilt?: number }) {
  const c = SHIELD_TONES[tone];
  return (
    <svg viewBox="0 0 64 72" width={size} height={(size * 72) / 64} style={{ transform: `rotate(${tilt}deg)` }} aria-hidden>
      <path d="M6 10c0-4 3-6 7-6h38c4 0 7 2 7 6v22c0 18-12 30-26 36C18 62 6 50 6 32V10Z" fill={c.edge} />
      <path d="M10 12c0-3 2-4 5-4h34c3 0 5 1 5 4v20c0 15-10 25-22 30C20 57 10 47 10 32V12Z" fill={c.face} />
      <path d="M10 12c0-3 2-4 5-4h18L14 52c-3-6-4-12-4-20V12Z" fill={c.shine} opacity=".55" />
      {tone === "gold" && (
        <path d="M40 18c-8 0-15 8-15 17 0 3 1 6 2 8l-5 7 2 1 5-6c2 1 4 2 6 2 7 0 12-8 12-18 0-6-3-11-7-11Z" fill="#ff9600" opacity=".9" />
      )}
    </svg>
  );
}

export const PencilIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M4 20l1-5L15.5 4.5a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3L9 19l-5 1Z" fill="currentColor" />
  </svg>
);

/** Orange circular-arrows badge used for "Previous mistake". */
export const RetryIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <circle cx="12" cy="12" r="11" fill="#ff9600" />
    <path d="M7.5 10.5a5 5 0 0 1 8.6-2.2M16.5 13.5a5 5 0 0 1-8.6 2.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="m16.6 5.8.2 3.2-3.2.2M7.4 18.2l-.2-3.2 3.2-.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/** Top-3 finish medal: gold when earned, greyed out at zero (as on the original's profile). */
export const MedalIcon = ({ muted, ...p }: P & { muted?: boolean }) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M7 13 4.5 21l3.5-1.5L10 22l2-6" style={{ fill: muted ? "var(--icon-muted-2)" : "#ff4b4b" }} />
    <path d="M17 13l2.5 8-3.5-1.5L14 22l-2-6" style={{ fill: muted ? "var(--icon-muted-2)" : "#1cb0f6" }} />
    <circle cx="12" cy="10" r="7.5" style={{ fill: muted ? "var(--icon-muted)" : "#ffc800" }} />
    <circle cx="12" cy="10" r="4.5" fill="none" strokeWidth="2" style={{ stroke: muted ? "var(--icon-muted-2)" : "#e5a800" }} />
  </svg>
);

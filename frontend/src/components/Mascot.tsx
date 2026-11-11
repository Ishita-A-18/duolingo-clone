/**
 * "Pip", the app's original mascot: a round sprout creature drawn in SVG.
 * Moods change the face and arms so the same character can cheer on lesson
 * completion, sulk when hearts run out, or wave from the path.
 */
export type Mood = "happy" | "cheer" | "sad" | "wave" | "think";

const BODY = "#7c5cff";
const BODY_DARK = "#5b3fd9";
const BELLY = "#b9a8ff";

export function Mascot({ mood = "happy", size = 120, className = "" }: { mood?: Mood; size?: number; className?: string }) {
  const armsUp = mood === "cheer";
  return (
    <svg viewBox="0 0 120 130" width={size} height={(size * 130) / 120} className={className} aria-hidden>
      {/* sprout */}
      <path d="M60 22c0-8 2-13 6-16" stroke="#58a700" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M64 10c6-8 16-8 20-4-4 7-13 9-20 4Z" fill="#58cc02" />
      <path d="M62 14c-6-7-15-6-18-2 4 6 12 7 18 2Z" fill="#79d634" />

      {/* feet */}
      <ellipse cx="44" cy="120" rx="12" ry="6" fill="#ff9600" />
      <ellipse cx="76" cy="120" rx="12" ry="6" fill="#ff9600" />

      {/* arms */}
      {armsUp ? (
        <>
          <path d="M22 66C12 56 10 44 14 36" stroke={BODY_DARK} strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M98 66c10-10 12-22 8-30" stroke={BODY_DARK} strokeWidth="11" strokeLinecap="round" fill="none" />
        </>
      ) : mood === "wave" ? (
        <>
          <path d="M22 72c-8 6-10 14-8 20" stroke={BODY_DARK} strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M98 66c10-8 14-18 12-26" stroke={BODY_DARK} strokeWidth="11" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <path d="M22 72c-8 6-10 14-8 20" stroke={BODY_DARK} strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M98 72c8 6 10 14 8 20" stroke={BODY_DARK} strokeWidth="11" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* body */}
      <ellipse cx="60" cy="72" rx="44" ry="46" fill={BODY} />
      <ellipse cx="60" cy="86" rx="28" ry="26" fill={BELLY} />
      <ellipse cx="38" cy="44" rx="10" ry="6" fill="#fff" opacity=".25" transform="rotate(-30 38 44)" />

      {/* eyes */}
      {mood === "cheer" ? (
        <>
          <path d="M34 58q8-9 16 0" stroke="#1f1147" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M70 58q8-9 16 0" stroke="#1f1147" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="42" cy="58" rx="10" ry="12" fill="#fff" />
          <ellipse cx="78" cy="58" rx="10" ry="12" fill="#fff" />
          <circle cx={mood === "think" ? 45 : 43} cy={mood === "sad" ? 62 : 59} r="5.5" fill="#1f1147" />
          <circle cx={mood === "think" ? 81 : 79} cy={mood === "sad" ? 62 : 59} r="5.5" fill="#1f1147" />
          <circle cx="45" cy="56" r="1.8" fill="#fff" />
          <circle cx="81" cy="56" r="1.8" fill="#fff" />
        </>
      )}
      {mood === "sad" && (
        <>
          {/* inner ends raised = sad (lowered would read as angry) */}
          <path d="M31 49l14-5M89 49l-14-5" stroke="#1f1147" strokeWidth="4" strokeLinecap="round" />
          <path d="M33 72c-2 4-2 7 1 8 3-1 3-4-1-8Z" fill="#84d8ff" />
        </>
      )}

      {/* cheeks */}
      <ellipse cx="30" cy="74" rx="6" ry="4" fill="#ff86d0" opacity=".7" />
      <ellipse cx="90" cy="74" rx="6" ry="4" fill="#ff86d0" opacity=".7" />

      {/* mouth */}
      {mood === "sad" ? (
        <path d="M50 82q10-8 20 0" stroke="#1f1147" strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : mood === "think" ? (
        <path d="M52 80h14" stroke="#1f1147" strokeWidth="4" strokeLinecap="round" />
      ) : mood === "cheer" ? (
        <path d="M46 74q14 18 28 0Z" fill="#1f1147" stroke="#1f1147" strokeWidth="2" strokeLinejoin="round" />
      ) : (
        <path d="M49 76q11 10 22 0" stroke="#1f1147" strokeWidth="4" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}

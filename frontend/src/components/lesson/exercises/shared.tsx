"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { speak } from "@/lib/sound";
import type { Answer, Exercise } from "@/lib/types";
import { SpeakerIcon } from "../../icons";
import { Mascot } from "../../Mascot";

export interface ExerciseProps {
  exercise: Exercise;
  /** True once the answer has been checked: inputs freeze. */
  locked: boolean;
  /** Outcome of the check, so the chosen option can turn green or red. */
  result: "correct" | "wrong" | null;
  /** Report the current draft answer (null = nothing to check yet). */
  onChange: (answer: Answer | null) => void;
  /** For exercises that grade themselves when finished (match pairs). */
  onSubmit: (answer: Answer) => void;
  sound: boolean;
  /** Settings -> Listening exercises: read Spanish aloud automatically. */
  listening: boolean;
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Press 1..9 to pick an option, like the original's keyboard shortcuts. */
export function useNumberKeys(count: number, onPick: (index: number) => void, disabled: boolean) {
  // Effect Event: always calls the latest onPick without re-subscribing.
  const pick = useEffectEvent(onPick);
  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const n = e.key === "0" ? 10 : Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= count) pick(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, disabled]);
}

/**
 * data-state for the option the learner picked. As in the original: blue while
 * choosing, green if it was right, and it simply *stays blue* if it was wrong.
 * The red feedback bar carries the "wrong" signal.
 */
export function choiceState(isSelected: boolean, result: ExerciseProps["result"]) {
  if (!isSelected) return undefined;
  return result === "correct" ? "correct" : "selected";
}

export function KeyHint({ n, active }: { n: number; active?: boolean }) {
  // Inherits the tile's state color (blue / green / red) when active.
  return (
    <span
      className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-extrabold sm:flex ${
        active ? "border-current" : "border-line text-gray"
      }`}
    >
      {n}
    </span>
  );
}

export function SpeakButton({ text, lang, size = 28 }: { text: string; lang: string | null; size?: number }) {
  return (
    <button
      type="button"
      onClick={() => speak(text, lang)}
      aria-label="Play audio"
      className="shrink-0 text-blue hover:brightness-110 active:scale-95"
    >
      <SpeakerIcon size={size} />
    </button>
  );
}

/** Mascot with a speech bubble holding the prompt, auto-read aloud once. */
export function SpeechBubble({ text, lang, autoPlay, hints = {} }: {
  text: string;
  lang: string | null;
  autoPlay?: boolean;
  hints?: Record<string, string>;
}) {
  useEffect(() => {
    if (autoPlay && lang === "es") speak(text, lang);
  }, [text, lang, autoPlay]);

  return (
    <div className="flex items-end gap-2">
      <Mascot mood="happy" size={96} className="shrink-0" />
      <div className="relative mb-8 flex items-center gap-3 rounded-2xl border-2 border-line px-4 py-3 text-lg font-semibold text-ink-strong">
        <span className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-bg" />
        <SpeakButton text={text} lang={lang} size={24} />
        <span className="flex flex-wrap gap-x-[0.3em]">
          {text.split(" ").map((word, i) => (
            <HintedWord key={i} word={word} hint={hints[word.replace(/[.,!?¿¡]/g, "").toLowerCase()]} />
          ))}
        </span>
      </div>
    </div>
  );
}

/**
 * A prompt word with a dotted underline; hovering (or tapping, on touch)
 * shows its meaning in a small bubble underneath, like the original.
 */
function HintedWord({ word, hint }: { word: string; hint?: string }) {
  const [open, setOpen] = useState(false);
  if (!hint) return <span>{word}</span>;
  return (
    <span
      className="relative cursor-default border-b-2 border-dotted border-line-strong"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
    >
      {word}
      {open && (
        <span className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 animate-pop whitespace-nowrap rounded-xl border-2 border-line bg-bg-soft px-3 py-2 text-base font-semibold text-ink-strong shadow-lg">
          <span className="absolute -top-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-line bg-bg-soft" />
          {hint}
        </span>
      )}
    </span>
  );
}

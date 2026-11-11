"use client";

import { useEffect, useRef, useState } from "react";
import { SpeechBubble, type ExerciseProps } from "./shared";

/** Free-text translation. Enter submits (handled by the player). */
export function TypeAnswer({ exercise, locked, onChange, listening }: ExerciseProps) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const target = exercise.prompt_language === "es" ? "English" : "Spanish";

  useEffect(() => ref.current?.focus(), []);

  return (
    <div className="flex flex-col gap-6">
      {exercise.prompt && <SpeechBubble text={exercise.prompt} lang={exercise.prompt_language} hints={exercise.hints} autoPlay={listening} />}
      <textarea
        ref={ref}
        value={text}
        disabled={locked}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.trim() ? { text: e.target.value } : null);
        }}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        placeholder={`Type in ${target}`}
        rows={4}
        spellCheck={false}
        autoCapitalize="off"
        className="w-full resize-none rounded-2xl border-2 border-line bg-bg-soft p-4 text-lg font-semibold text-ink-strong outline-none placeholder:text-gray focus:border-blue-border disabled:opacity-70"
      />
      {target === "Spanish" && <AccentKeys onPick={(ch) => {
        const next = text + ch;
        setText(next);
        onChange({ text: next });
        ref.current?.focus();
      }} disabled={locked} />}
    </div>
  );
}

/** Helper keys for Spanish characters most keyboards lack. */
function AccentKeys({ onPick, disabled }: { onPick: (ch: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {["á", "é", "í", "ó", "ú", "ñ", "¿", "¡"].map((ch) => (
        <button key={ch} type="button" disabled={disabled} onClick={() => onPick(ch)} className="tile h-10 w-10 text-lg font-bold">
          {ch}
        </button>
      ))}
    </div>
  );
}

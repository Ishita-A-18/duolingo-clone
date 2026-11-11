"use client";

import { useState } from "react";
import { playSound, speak } from "@/lib/sound";
import { SpeechBubble, type ExerciseProps } from "./shared";

/**
 * Translate by tapping word tiles. Tapping a bank tile moves it onto the answer
 * lines; tapping a placed tile sends it back. Used tiles leave a grey
 * placeholder in the bank so the layout never jumps.
 */
export function WordBank({ exercise, locked, onChange, sound, listening }: ExerciseProps) {
  const [placed, setPlaced] = useState<number[]>([]);
  const byId = new Map(exercise.options.map((o) => [o.id, o]));
  const answerIsSpanish = exercise.prompt_language === "en";

  const update = (next: number[]) => {
    setPlaced(next);
    onChange(next.length ? { option_ids: next } : null);
  };
  const add = (id: number) => {
    if (locked || placed.includes(id)) return;
    playSound("tap", sound);
    if (answerIsSpanish && listening) speak(byId.get(id)!.text, "es");
    update([...placed, id]);
  };
  const remove = (id: number) => !locked && update(placed.filter((p) => p !== id));

  return (
    <div className="flex flex-col gap-6">
      {exercise.prompt && <SpeechBubble text={exercise.prompt} lang={exercise.prompt_language} hints={exercise.hints} autoPlay={listening} />}

      {/* answer lines */}
      <div
        className="flex min-h-[120px] flex-wrap content-start gap-2 py-2"
        style={{ backgroundImage: "linear-gradient(transparent 58px, var(--line) 58px, var(--line) 60px)", backgroundSize: "100% 60px" }}
      >
        {placed.map((id) => (
          <button key={id} className="tile h-[50px] animate-pop px-4 text-lg font-semibold" disabled={locked} onClick={() => remove(id)}>
            {byId.get(id)!.text}
          </button>
        ))}
      </div>

      {/* word bank */}
      <div className="flex flex-wrap justify-center gap-2">
        {exercise.options.map((o) =>
          placed.includes(o.id) ? (
            <span key={o.id} className="h-[50px] rounded-2xl bg-line px-4 text-lg font-semibold leading-[50px] text-transparent">
              {o.text}
            </span>
          ) : (
            <button key={o.id} className="tile h-[50px] px-4 text-lg font-semibold" disabled={locked} onClick={() => add(o.id)}>
              {o.text}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

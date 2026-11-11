"use client";

import { useState } from "react";
import { playSound } from "@/lib/sound";
import { choiceState, KeyHint, useNumberKeys, type ExerciseProps } from "./shared";

/** "Yo ___ agua." with chips to choose the missing word. */
export function FillBlank({ exercise, locked, result, onChange, sound }: ExerciseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const options = exercise.options;
  const chosen = options.find((o) => o.id === selected);
  const [before, after] = (exercise.sentence ?? "___").split("___");

  const choose = (i: number) => {
    if (locked) return;
    setSelected(options[i].id);
    onChange({ option_id: options[i].id });
    playSound("tap", sound);
  };
  useNumberKeys(options.length, choose, locked);

  return (
    <div className="flex flex-col gap-8">
      {exercise.prompt && (
        <p className="text-lg font-semibold text-ink-muted">
          <span className="mr-2 rounded-lg bg-purple-light px-2 py-0.5 text-sm font-extrabold uppercase text-purple-dark">Meaning</span>
          {exercise.prompt}
        </p>
      )}
      <p className="flex flex-wrap items-end gap-x-2 gap-y-3 text-2xl font-semibold text-ink-strong">
        {before && <span>{before.trim()}</span>}
        <span
          className={`inline-flex min-w-24 justify-center border-b-2 px-2 pb-1 ${
            !chosen ? "border-ink-muted" : result === "correct" ? "border-green text-green-dark" : "border-blue text-blue-dark"
          }`}
        >
          {chosen ? <span className="animate-pop">{chosen.text}</span> : " "}
        </span>
        {after && <span>{after.trim()}</span>}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {options.map((o, i) => (
          <button
            key={o.id}
            className="tile flex items-center gap-3 px-4 py-3 text-lg font-semibold"
            data-state={choiceState(selected === o.id, result)}
            disabled={locked}
            onClick={() => choose(i)}
          >
            <KeyHint n={i + 1} active={selected === o.id} />
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}

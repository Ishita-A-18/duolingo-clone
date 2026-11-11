"use client";

import { useState } from "react";
import { playSound, speak } from "@/lib/sound";
import { choiceState, KeyHint, SpeechBubble, useNumberKeys, type ExerciseProps } from "./shared";

/**
 * Two layouts, like the original:
 *  - picture cards ("Which one of these is 'the coffee'?"): image on top,
 *    word bottom-left, key number bottom-right
 *  - a prompt bubble with full-width rows of text answers
 * After Check, the chosen option turns green when right; a wrong pick stays
 * blue and the red feedback bar carries the signal (as in the original).
 */
export function MultipleChoice({ exercise, locked, result, onChange, sound, listening }: ExerciseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const options = exercise.options;
  const pictures = options.every((o) => o.image);

  const choose = (i: number) => {
    if (locked) return;
    const opt = options[i];
    setSelected(opt.id);
    onChange({ option_id: opt.id });
    playSound("tap", sound);
    // Picture options are in Spanish: read them aloud like the original does.
    if (pictures && listening) speak(opt.text, "es");
  };
  useNumberKeys(options.length, choose, locked);

  if (pictures) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {options.map((o, i) => {
          const state = choiceState(selected === o.id, result);
          return (
            <button
              key={o.id}
              className="tile flex aspect-[3/4] flex-col justify-between p-3 sm:p-4"
              data-state={state}
              disabled={locked}
              onClick={() => choose(i)}
            >
              <span className="flex flex-1 items-center justify-center text-5xl sm:text-7xl">{o.image}</span>
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-left text-base font-semibold sm:text-lg">{o.text}</span>
                <KeyHint n={i + 1} active={!!state} />
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {exercise.prompt && <SpeechBubble text={exercise.prompt} lang={exercise.prompt_language} autoPlay={listening} />}
      <div className="flex flex-col gap-3">
        {options.map((o, i) => {
          const state = choiceState(selected === o.id, result);
          return (
            <button
              key={o.id}
              className="tile flex items-center gap-4 px-4 py-3 text-lg font-semibold"
              data-state={state}
              disabled={locked}
              onClick={() => choose(i)}
            >
              <KeyHint n={i + 1} active={!!state} />
              <span className="flex-1 text-center">{o.text}</span>
              {/* balances the key hint so the text is truly centered */}
              <span className="hidden w-7 sm:block" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

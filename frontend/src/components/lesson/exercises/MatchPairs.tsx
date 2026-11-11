"use client";

import { useEffect, useState } from "react";
import { playSound, speak } from "@/lib/sound";
import { KeyHint, shuffle, useNumberKeys, type ExerciseProps } from "./shared";

interface Card {
  pairId: number;
  side: "left" | "right";
  text: string;
}

/**
 * Tap an English word, then its Spanish match (either order works). Correct pairs flash green and
 * retire; wrong pairs shake red. Mismatches here don't cost hearts. The
 * exercise submits itself once every pair is matched.
 */
export function MatchPairs({ exercise, locked, onSubmit, sound, listening }: ExerciseProps) {
  // English meanings on the left, Spanish words on the right, as in the original.
  const [left] = useState<Card[]>(() =>
    shuffle(exercise.pairs.map((p) => ({ pairId: p.id, side: "left" as const, text: p.right }))),
  );
  const [right] = useState<Card[]>(() =>
    shuffle(exercise.pairs.map((p) => ({ pairId: p.id, side: "right" as const, text: p.left }))),
  );
  const [selected, setSelected] = useState<Card | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [flash, setFlash] = useState<{ cards: Card[]; ok: boolean } | null>(null);

  useEffect(() => {
    if (matched.length === exercise.pairs.length && !locked) {
      const t = setTimeout(() => onSubmit({ option_ids: matched }), 350);
      return () => clearTimeout(t);
    }
  }, [matched, exercise.pairs.length, locked, onSubmit]);

  const tap = (card: Card) => {
    if (locked || matched.includes(card.pairId) || flash) return;
    if (card.side === "right" && listening) speak(card.text, "es"); // read the Spanish word aloud
    if (!selected || selected.side === card.side) {
      setSelected(selected === card ? null : card);
      playSound("tap", sound);
      return;
    }
    const ok = selected.pairId === card.pairId;
    playSound(ok ? "correct" : "wrong", sound);
    setFlash({ cards: [selected, card], ok });
    setSelected(null);
    setTimeout(() => {
      if (ok) setMatched((m) => [...m, card.pairId]);
      setFlash(null);
    }, ok ? 300 : 500);
  };

  const all = [...left, ...right];
  useNumberKeys(all.length, (i) => tap(all[i]), locked);

  const stateOf = (c: Card) => {
    if (flash?.cards.includes(c)) return flash.ok ? "correct" : "wrong";
    if (matched.includes(c.pairId)) return "done";
    if (selected === c) return "selected";
    return undefined;
  };

  const column = (cards: Card[], offset: number) => (
    <div className="flex flex-1 flex-col gap-3">
      {cards.map((c, i) => {
        const state = stateOf(c);
        return (
          <button
            key={`${c.side}-${c.pairId}`}
            className={`tile flex min-h-[56px] items-center gap-3 px-3 text-left text-lg font-semibold ${state === "wrong" ? "animate-shake" : ""}`}
            data-state={state}
            disabled={state === "done"}
            onClick={() => tap(c)}
          >
            <KeyHint n={(offset + i + 1) % 10} active={state === "selected"} />
            <span className="flex-1 text-center">{c.text}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex gap-4 sm:gap-6">
      {column(left, 0)}
      {column(right, left.length)}
    </div>
  );
}

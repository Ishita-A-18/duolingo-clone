"use client";

import { TreasureChest } from "./icons";

/** "You earned N gems!" block used by path chests and the daily-goal chest. */
export function GemReward({ gems, message }: { gems: number; message: string }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="animate-pop">
        <TreasureChest state="open" size={200} />
      </div>
      <h2 className="text-2xl font-extrabold text-ink-strong">You earned {gems} gems!</h2>
      <p className="text-lg font-semibold text-ink">{message}</p>
    </div>
  );
}

"use client";

import { mutate } from "swr";
import type { ReactNode } from "react";
import { FlameIcon, GemIcon, HeartIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { useToast } from "@/components/Toasts";
import { api, ApiError } from "@/lib/api";
import { KEYS, useMe } from "@/lib/hooks";

export default function ShopPage() {
  const { data: me } = useMe();
  const toast = useToast();

  const refill = async () => {
    try {
      await mutate(KEYS.me, api.refillHearts(), { revalidate: false });
      toast({ title: "Hearts refilled!", icon: <HeartIcon size={28} /> });
    } catch (e) {
      toast({ title: e instanceof ApiError ? e.message : "Couldn't refill", tone: "error" });
    }
  };
  const full = !!me && me.hearts >= me.max_hearts;
  const soon = () => toast({ title: "Super is coming soon", body: "Subscriptions aren't part of this demo.", tone: "info" });

  return (
    <div>
      {/* Super promo banner (subscriptions are a placeholder in this demo) */}
      <section className="overflow-hidden rounded-2xl bg-linear-to-br from-[#1a2a78] via-[#24227a] to-[#4b1f7a] p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <span className="rounded-lg bg-linear-to-r from-[#26ff55] via-[#00c2ff] to-[#9d4dff] px-2 py-0.5 text-sm font-black uppercase">Super</span>
            <h1 className="mt-3 text-2xl font-extrabold">Learn faster with Super</h1>
            <p className="mt-1 font-semibold text-white/85">Unlimited hearts, no ads and personalized practice.</p>
          </div>
          <Mascot mood="cheer" size={96} />
        </div>
        <button className="btn mt-5 w-full !text-[#1a2a78]" style={{ "--btn-bg": "#fff", "--btn-edge": "#b6b3e6" } as React.CSSProperties} onClick={soon}>
          Start my free month
        </button>
      </section>

      <h2 className="mt-10 border-b-2 border-line pb-4 text-2xl font-extrabold text-ink-strong">Hearts</h2>
      <Item
        icon={<HeartIcon size={56} />}
        title="Refill hearts"
        body={full ? "You already have full hearts." : "Get full hearts so you can worry less about making mistakes."}
        action={
          <button className="btn btn-outline !text-blue" disabled={!me || full || me.gems < me.heart_refill_cost} onClick={refill}>
            Get for: <GemIcon size={22} /> {me?.heart_refill_cost ?? 350}
          </button>
        }
      />
      <Item
        icon={<Mascot mood="cheer" size={56} />}
        title="Unlimited hearts"
        body="Never run out of hearts with Super."
        action={<button className="btn btn-outline !text-[#d33cd9]" onClick={soon}>Free trial</button>}
      />

      <h2 className="mt-10 border-b-2 border-line pb-4 text-2xl font-extrabold text-ink-strong">Power-ups</h2>
      <Item
        icon={<FlameIcon size={56} />}
        title="Streak freeze"
        body="Keep your streak in place for one full day of inactivity."
        action={<span className="rounded-full bg-blue-light px-3 py-1 text-xs font-extrabold uppercase text-blue-dark">Coming soon</span>}
      />
      <Item
        icon={<GemIcon size={56} />}
        title="Buy gems"
        body="Gems are earned in-app. Purchases aren't available in this demo."
        action={<span className="rounded-full bg-blue-light px-3 py-1 text-xs font-extrabold uppercase text-blue-dark">Coming soon</span>}
      />
    </div>
  );
}

function Item({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action: ReactNode }) {
  return (
    <div className="flex items-center gap-5 border-b-2 border-line py-6">
      <div className="flex w-16 justify-center">{icon}</div>
      <div className="flex-1">
        <h3 className="text-lg font-extrabold text-ink-strong">{title}</h3>
        <p className="font-semibold text-ink-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}

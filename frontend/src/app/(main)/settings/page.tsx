"use client";

import { useState, type ReactNode } from "react";
import useSWR, { mutate } from "swr";
import { ThemePicker } from "@/components/ThemePicker";
import { useToast } from "@/components/Toasts";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import { KEYS, refreshLearnerData, useMe } from "@/lib/hooks";

const GOALS = [
  { xp: 10, label: "Casual" },
  { xp: 20, label: "Regular" },
  { xp: 30, label: "Serious" },
  { xp: 50, label: "Intense" },
];

export default function SettingsPage() {
  const { data: me } = useMe();
  const toast = useToast();

  const save = async (patch: Parameters<typeof api.updateMe>[0], message = "Settings saved") => {
    try {
      await mutate(KEYS.me, api.updateMe(patch), { revalidate: false });
      mutate(KEYS.profile);
      toast({ title: message, tone: "info" });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Couldn't save", tone: "error" });
    }
  };

  if (!me) return null;

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-extrabold text-ink-strong">Preferences</h1>

      <Section title="Lesson experience">
        <Toggle label="Sound effects" checked={me.sound_enabled} onChange={(v) => save({ sound_enabled: v })} />
        <Toggle label="Animations" checked={me.animations_enabled} onChange={(v) => save({ animations_enabled: v })} />
        <Toggle label="Motivational messages" checked={me.motivational_messages} onChange={(v) => save({ motivational_messages: v })} />
        <Toggle label="Listening exercises" checked={me.listening_enabled} onChange={(v) => save({ listening_enabled: v })} />
        <Placeholder label="Speaking exercises" />
      </Section>

      <Section title="Appearance">
        <p className="mb-3 text-lg font-bold text-ink-strong">Dark mode</p>
        <ThemePicker />
      </Section>

      <Section title="Daily goal">
        <div className="flex flex-col gap-2">
          {GOALS.map((g) => (
            <button
              key={g.xp}
              className="tile flex items-center justify-between px-4 py-3 font-extrabold"
              data-state={me.daily_goal_xp === g.xp ? "selected" : undefined}
              onClick={() => save({ daily_goal_xp: g.xp }, `Daily goal set to ${g.xp} XP`)}
            >
              <span>{g.label}</span>
              <span className="font-semibold">{g.xp} XP per day</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Profile">
        {/* keyed so the draft resets whenever the saved name changes */}
        <NameField key={me.display_name} saved={me.display_name} onSave={(display_name) => save({ display_name })} />
      </Section>

      <DevTools />
    </div>
  );
}

/** Section heading with a rule underneath, as on the original's settings page. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 border-b-2 border-line pb-4 text-2xl font-extrabold text-ink-strong">{title}</h2>
      {children}
    </section>
  );
}

function NameField({ saved, onSave }: { saved: string; onSave: (name: string) => void }) {
  const [name, setName] = useState(saved);
  return (
    <>
      <label className="text-sm font-extrabold uppercase tracking-wider text-ink-muted" htmlFor="name">Name</label>
      <div className="mt-2 flex gap-3">
        <input
          id="name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border-2 border-line bg-bg-soft px-4 py-3 font-semibold text-ink-strong outline-none focus:border-blue-border"
        />
        <button className="btn btn-blue" disabled={!name.trim() || name === saved} onClick={() => onSave(name.trim())}>
          Save
        </button>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-lg font-bold text-ink-strong">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label}>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        aria-label={label}
        className={`relative h-10 w-[78px] rounded-xl transition-colors ${checked ? "bg-blue" : "bg-line"}`}
      >
        <span
          className={`absolute top-0 h-10 w-10 rounded-xl border-2 border-b-4 bg-bg transition-all ${
            checked ? "left-[38px] border-blue" : "left-0 border-line-strong"
          }`}
        />
      </button>
    </Row>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <Row label={label}>
      <span className="rounded-full bg-bg-soft px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-gray">Coming soon</span>
    </Row>
  );
}

/**
 * Lets a reviewer test time-based mechanics without waiting: jump the
 * server's clock forward to see a streak extend or break and hearts regenerate.
 */
function DevTools() {
  const toast = useToast();
  const { data: clock, mutate: refreshClock } = useSWR("dev-clock", api.devClock, { shouldRetryOnError: false });
  const [busy, setBusy] = useState(false);
  if (!clock) return null;

  const run = async (fn: () => Promise<unknown>, title: string) => {
    setBusy(true);
    try {
      await fn();
      await Promise.all([refreshClock(), refreshLearnerData()]);
      toast({ title, tone: "info" });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Failed", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-dashed">
      <h2 className="text-lg font-extrabold text-ink-strong">Developer tools</h2>
      <p className="mb-4 font-semibold text-ink-muted">
        Simulated clock: <b>+{clock.offset_days} day{clock.offset_days === 1 ? "" : "s"}</b> ({new Date(`${clock.now}Z`).toUTCString()})
      </p>
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-blue" disabled={busy} onClick={() => run(api.devAdvanceDay, "Moved to the next day")}>
          Simulate next day
        </button>
        <button className="btn btn-outline" disabled={busy || clock.offset_days === 0} onClick={() => run(() => api.devSetClock(0), "Clock reset to today")}>
          Reset clock
        </button>
        <button
          className="btn btn-outline !text-red"
          disabled={busy}
          onClick={() => confirm("Wipe all progress and reseed the demo data?") && run(api.devReset, "Demo data reset")}
        >
          Reset demo data
        </button>
      </div>
    </Card>
  );
}

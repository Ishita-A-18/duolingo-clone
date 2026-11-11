"use client";

import { useSyncExternalStore } from "react";
import { applyThemeMode, readThemeMode, type ThemeMode } from "@/lib/themeMode";

// A tiny external store over localStorage, so the picker reads the saved
// mode without a hydration mismatch (the server always renders "system").
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
};

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "system", label: "System default" },
  { mode: "dark", label: "On" },
  { mode: "light", label: "Off" },
];

/** "Dark mode" dropdown, styled like the original's select. */
export function ThemePicker() {
  const mode = useSyncExternalStore(subscribe, readThemeMode, () => "system" as ThemeMode);
  const choose = (m: ThemeMode) => {
    applyThemeMode(m);
    listeners.forEach((fn) => fn());
  };
  return (
    <div className="relative">
      <select
        aria-label="Dark mode"
        value={mode}
        onChange={(e) => choose(e.target.value as ThemeMode)}
        className="w-full cursor-pointer appearance-none rounded-2xl border-2 border-b-4 border-line bg-bg px-4 py-3.5 text-[15px] font-extrabold uppercase tracking-wide text-ink-strong outline-none focus:border-blue-border"
      >
        {OPTIONS.map((o) => (
          <option key={o.mode} value={o.mode}>{o.label}</option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" width="22" height="22" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden>
        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

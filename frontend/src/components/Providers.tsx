"use client";

import { useEffect, type ReactNode } from "react";
import { mutate, SWRConfig } from "swr";
import { api } from "@/lib/api";
import { KEYS, useMe } from "@/lib/hooks";
import { ToastProvider } from "./Toasts";

/** Tell the backend which timezone "today" should use for streaks and goals. */
function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) api.updateMe({ timezone: tz }).then((me) => mutate(KEYS.me, me, { revalidate: false })).catch(() => {});
  }, []);
  return null;
}

/** Mirrors the learner's "Animations" preference onto <html> so CSS can switch motion off. */
function AnimationPreference() {
  const { data: me } = useMe();
  useEffect(() => {
    if (me) document.documentElement.dataset.animations = me.animations_enabled ? "on" : "off";
  }, [me]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ revalidateOnFocus: true, shouldRetryOnError: false }}>
      <ToastProvider>
        <TimezoneSync />
        <AnimationPreference />
        {children}
      </ToastProvider>
    </SWRConfig>
  );
}

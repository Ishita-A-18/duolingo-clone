"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Tone = "success" | "info" | "error" | "gold";
interface Toast {
  id: number;
  title: string;
  body?: string;
  icon?: ReactNode;
  tone: Tone;
}

const ToastContext = createContext<(t: Omit<Toast, "id" | "tone"> & { tone?: Tone }) => void>(() => {});

// Border/text colors, plus a tint layered over a solid surface. In dark mode
// the *-light tints are translucent, so they must never be the only background.
const TONES: Record<Tone, { frame: string; tint: string }> = {
  success: { frame: "border-green text-green-dark", tint: "bg-green-light" },
  info: { frame: "border-blue-border text-blue-dark", tint: "bg-blue-light" },
  error: { frame: "border-red text-red-dark", tint: "bg-red-light" },
  gold: { frame: "border-gold text-gold-dark", tint: "bg-gold-light" },
};

/** Lightweight toast queue: `useToast()({ title, body, icon })`. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id" | "tone"> & { tone?: Tone }) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all, { tone: "success", ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto relative flex w-full max-w-sm animate-pop items-center gap-3 overflow-hidden rounded-2xl border-2 border-b-4 bg-bg px-4 py-3 shadow-lg ${TONES[t.tone].frame}`}
          >
            <span aria-hidden className={`absolute inset-0 ${TONES[t.tone].tint}`} />
            {t.icon && <div className="relative shrink-0">{t.icon}</div>}
            <div className="relative">
              <p className="font-extrabold">{t.title}</p>
              {t.body && <p className="text-sm font-semibold opacity-80">{t.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

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

const TONES: Record<Tone, string> = {
  success: "border-green bg-green-light text-green-dark",
  info: "border-blue-border bg-blue-light text-blue-dark",
  error: "border-red bg-red-light text-red-dark",
  gold: "border-gold bg-gold-light text-[#b57f00]",
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
            className={`pointer-events-auto flex w-full max-w-sm animate-pop items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 shadow-lg ${TONES[t.tone]}`}
          >
            {t.icon && <div className="shrink-0">{t.icon}</div>}
            <div>
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

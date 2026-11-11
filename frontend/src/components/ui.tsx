"use client";

import { useEffect, type ReactNode } from "react";
import { Mascot } from "./Mascot";

export function ProgressBar({ value, color = "var(--color-green)", height = 16, className = "" }: {
  value: number; // 0..1
  color?: string;
  height?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-line ${className}`} style={{ height }}>
      <div
        className="relative h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? height : 0 }}
      >
        {/* glossy highlight stripe */}
        <div
          className="absolute rounded-full bg-white/30"
          style={{ left: height / 2, right: height / 2, top: height * 0.22, height: height * 0.22 }}
        />
      </div>
    </div>
  );
}

export function Modal({ open, onClose, children, className = "" }: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        className={`w-full max-w-md animate-pop rounded-t-3xl bg-bg p-6 text-center sm:rounded-3xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border-2 border-line p-5 ${className}`}>{children}</section>;
}

export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Mascot mood="think" size={130} />
      <h2 className="text-2xl font-extrabold text-ink-strong">{title}</h2>
      <p className="max-w-sm text-ink-muted">{description ?? "This feature is coming soon. Check back later!"}</p>
      <span className="rounded-full bg-blue-light px-4 py-1 text-sm font-extrabold uppercase tracking-wider text-blue-dark">
        Coming soon
      </span>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-blue" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Mascot mood="sad" size={110} />
      <p className="max-w-sm font-bold text-ink-muted">{message}</p>
      {onRetry && (
        <button className="btn btn-blue" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

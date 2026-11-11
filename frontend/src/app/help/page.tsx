"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/Toasts";
import { Modal } from "@/components/ui";
import { APP_NAME } from "@/lib/brand";
import { FAQ } from "./faq";

/**
 * Help Center, laid out like the original's FAQ: a slim header, breadcrumb,
 * category cards with expandable questions, and a feedback call to action.
 */
export default function HelpPage() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b-2 border-line px-6 py-4 sm:px-8">
        <Link href="/learn" className="text-[32px] font-black lowercase tracking-tight text-green">{APP_NAME}</Link>
      </header>

      <main className="mx-auto max-w-[1060px] px-4 pb-20 pt-8 sm:px-6">
        <nav className="flex items-center gap-4 text-lg font-extrabold uppercase tracking-wide text-blue">
          <Link href="/help" className="hover:brightness-110">Help center</Link>
          <span className="text-ink-muted">›</span>
          <Link href="/learn" className="hover:brightness-110">Home</Link>
        </nav>

        <h1 className="mb-12 mt-12 text-center text-3xl font-extrabold text-ink-strong sm:text-4xl">Frequently Asked Questions</h1>

        <div className="flex flex-col gap-10">
          {FAQ.map((category) => (
            <section key={category.title} className="overflow-hidden rounded-3xl border-2 border-line">
              <h2 className="border-b-2 border-line px-6 py-6 text-xl font-extrabold text-blue sm:px-11">{category.title}</h2>
              {category.items.map((item, i) => (
                // <details> gives keyboard + screen-reader friendly expand/collapse for free
                <details key={item.q} className={`group ${i < category.items.length - 1 ? "border-b-2 border-line" : ""}`}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-7 text-lg font-semibold text-ink-strong hover:bg-bg-soft sm:px-11 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <svg viewBox="0 0 24 24" width="26" height="26" className="shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden>
                      <path d="m5 9 7 7 7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <p className="px-6 pb-7 text-lg leading-relaxed text-ink sm:px-11">{item.a}</p>
                </details>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-8">
          <p className="text-xl font-extrabold text-ink-strong">Still unsure about something?</p>
          <button className="btn btn-blue px-6" onClick={() => setFeedbackOpen(true)}>Send feedback</button>
        </div>
      </main>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}

/** Feedback form. There's no support inbox in this demo, so it confirms with a toast. */
function FeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const toast = useToast();
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-2xl font-extrabold text-ink-strong">Send feedback</h2>
      <p className="mt-2 font-semibold text-ink-muted">Tell us what&apos;s confusing or what you&apos;d like to see.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Your feedback"
        className="mt-5 w-full resize-none rounded-2xl border-2 border-line bg-bg-soft p-4 text-lg font-semibold text-ink-strong outline-none placeholder:text-gray focus:border-blue-border"
      />
      <button
        className="btn btn-blue mt-4 w-full"
        disabled={!text.trim()}
        onClick={() => {
          toast({ title: "Thanks for your feedback!", tone: "info" });
          setText("");
          onClose();
        }}
      >
        Submit
      </button>
      <button className="btn btn-ghost mt-2 w-full !text-ink-muted" onClick={onClose}>Cancel</button>
    </Modal>
  );
}

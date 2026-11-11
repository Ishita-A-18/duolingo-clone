/**
 * Tiny synthesized sound effects (Web Audio), so no audio assets are needed.
 * Each effect is a short sequence of notes: [frequency Hz, start s, length s].
 */
type Note = [number, number, number];

const EFFECTS: Record<string, { wave: OscillatorType; notes: Note[]; gain: number }> = {
  correct: { wave: "sine", gain: 0.18, notes: [[784, 0, 0.12], [1175, 0.09, 0.22]] },
  wrong: { wave: "triangle", gain: 0.2, notes: [[220, 0, 0.14], [185, 0.12, 0.25]] },
  complete: {
    wave: "sine",
    gain: 0.16,
    notes: [[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.14], [1047, 0.36, 0.4]],
  },
  tap: { wave: "sine", gain: 0.06, notes: [[660, 0, 0.05]] },
};

let ctx: AudioContext | null = null;

export function playSound(name: keyof typeof EFFECTS, enabled = true) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const fx = EFFECTS[name];
    const t0 = ctx.currentTime;
    for (const [freq, start, len] of fx.notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = fx.wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(fx.gain, t0 + start);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + start + len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + len);
    }
  } catch {
    // Audio is a nicety; never let it break the lesson.
  }
}

/** Read text aloud with the browser's speech synthesis (exercise audio). */
export function speak(text: string, lang: string | null) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "es" ? "es-ES" : "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

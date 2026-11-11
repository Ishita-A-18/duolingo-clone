"use client";

import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { api } from "@/lib/api";

/** Heart practice: no hearts at risk, earns one heart back on completion. */
export default function PracticePage() {
  return <LessonPlayer start={api.startHeartPractice} />;
}

"use client";

import { useParams } from "next/navigation";
import { useCallback } from "react";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { api } from "@/lib/api";

/** Plays the next lesson of a skill (or a review if it's already complete). */
export default function LessonPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const start = useCallback(() => api.startSkill(Number(skillId)), [skillId]);
  return <LessonPlayer start={start} />;
}

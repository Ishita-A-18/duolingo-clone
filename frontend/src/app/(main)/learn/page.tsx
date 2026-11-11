"use client";

import { LearningPath } from "@/components/path/LearningPath";
import { ErrorState, Spinner } from "@/components/ui";
import { usePath } from "@/lib/hooks";

export default function LearnPage() {
  const { data, error, mutate } = usePath();
  if (error) return <ErrorState message={error.message} onRetry={() => mutate()} />;
  if (!data) return <Spinner />;
  return <LearningPath path={data} />;
}

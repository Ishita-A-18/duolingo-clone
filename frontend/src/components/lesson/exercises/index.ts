import type { ComponentType } from "react";
import type { ExerciseType } from "@/lib/types";
import { FillBlank } from "./FillBlank";
import { MatchPairs } from "./MatchPairs";
import { MultipleChoice } from "./MultipleChoice";
import type { ExerciseProps } from "./shared";
import { TypeAnswer } from "./TypeAnswer";
import { WordBank } from "./WordBank";

/** Exercise type -> component. Adding a type = one component + one entry here. */
export const EXERCISES: Record<ExerciseType, ComponentType<ExerciseProps>> = {
  multiple_choice: MultipleChoice,
  translate: WordBank,
  match_pairs: MatchPairs,
  fill_blank: FillBlank,
  type_answer: TypeAnswer,
};

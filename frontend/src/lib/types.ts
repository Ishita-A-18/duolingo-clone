// Mirrors the backend Pydantic schemas (backend/app/schemas). Keep in sync.

export type NodeState = "completed" | "active" | "locked";
export type ExerciseType =
  | "multiple_choice"
  | "translate"
  | "match_pairs"
  | "fill_blank"
  | "type_answer";

export interface Course {
  id: number;
  code: string;
  title: string;
  learning_language: string;
  learning_language_name: string;
}

export interface DayActivity {
  date: string; // YYYY-MM-DD
  xp: number;
}

export interface Me {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  joined_at: string;
  course: Course | null;
  total_xp: number;
  gems: number;
  hearts: number;
  max_hearts: number;
  next_heart_at: string | null;
  /** Measured on the server's (possibly simulated) clock; count down locally. */
  next_heart_in_seconds: number | null;
  heart_refill_cost: number;
  /** One-time free refill (offered the first time you run out of hearts). */
  free_refill_available: boolean;
  streak: number;
  longest_streak: number;
  streak_extended_today: boolean;
  week: DayActivity[];
  daily_goal_xp: number;
  today_xp: number;
  sound_enabled: boolean;
  animations_enabled: boolean;
  motivational_messages: boolean;
  listening_enabled: boolean;
}

export interface Skill {
  id: number;
  title: string;
  icon: string;
  state: NodeState;
  lessons_completed: number;
  total_lessons: number;
  crowns: number;
  max_crowns: number;
}

export interface Chest {
  state: "locked" | "available" | "claimed";
  gems: number;
  /** 0-based index of the skill the chest follows on the path. */
  after_skill: number;
}

export interface Unit {
  id: number;
  position: number;
  section: number;
  title: string;
  description: string;
  color: string;
  state: NodeState;
  skills: Skill[];
  chest: Chest;
}

export interface LearningPath {
  course_id: number;
  course_title: string;
  units: Unit[];
}

export interface Option {
  id: number;
  text: string;
  image: string | null;
}

export interface Pair {
  id: number;
  left: string;
  right: string;
}

export interface Exercise {
  id: number;
  type: ExerciseType;
  instruction: string;
  prompt: string | null;
  prompt_language: string | null;
  sentence: string | null;
  /** word -> meaning, for the dotted-underline hover hints on Spanish prompts */
  hints: Record<string, string>;
  options: Option[];
  pairs: Pair[];
}

export interface LessonSession {
  id: string;
  mode: "lesson" | "review" | "heart_practice";
  skill_id: number | null;
  skill_title: string | null;
  lesson_position: number | null;
  total_lessons: number | null;
  hearts_at_risk: boolean;
  exercises: Exercise[];
}

/** What the learner submitted. Exactly one field is used per exercise type. */
export interface Answer {
  option_id?: number;
  option_ids?: number[];
  text?: string;
  skipped?: boolean;
}

export interface AnswerResult {
  correct: boolean;
  solution: string | null;
  note: string | null;
  hearts: number;
  next_heart_at: string | null;
}

export interface UnlockedAchievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface Completion {
  xp_earned: number;
  accuracy: number;
  duration_seconds: number;
  mistakes: number;
  streak: { previous: number; current: number; extended_today: boolean };
  today_xp: number;
  daily_goal_xp: number;
  daily_goal_reached_now: boolean;
  skill_id: number | null;
  skill_completed_now: boolean;
  crowns: number;
  unit_completed_now: boolean;
  heart_gained: boolean;
  /** Gems from the daily-goal chest (0 if none). */
  gems_earned: number;
  gems: number;
  hearts: number;
  total_xp: number;
  achievements_unlocked: UnlockedAchievement[];
}

export interface Achievement {
  metric: string;
  title: string;
  icon: string;
  color: string;
  level: number;
  max_level: number;
  value: number;
  next_threshold: number | null;
  description: string;
}

export interface Profile {
  me: Me;
  lessons_completed: number;
  crowns: number;
  skills_completed: number;
  total_skills: number;
  league: string | null; // null until leagues unlock
  league_rank: number | null;
  /** Finished weeks that ended in 1st-3rd place. */
  top3_finishes: number;
  achievements: Achievement[];
}

export interface Standing {
  rank: number;
  user_id: number;
  display_name: string;
  avatar_color: string;
  weekly_xp: number;
  is_me: boolean;
}

export interface Leaderboard {
  league: string;
  week_start: string;
  days_left: number;
  promotion_zone: number;
  /** Leagues unlock after a few completed lessons; standings are empty until then. */
  unlocked: boolean;
  lessons_to_unlock: number;
  standings: Standing[];
}

export interface DevClock {
  offset_days: number;
  now: string;
}

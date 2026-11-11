import type {
  Answer,
  AnswerResult,
  Completion,
  DevClock,
  LearningPath,
  Leaderboard,
  LessonSession,
  Me,
  Profile,
} from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** Error carrying the backend's machine-readable code, e.g. "out_of_hearts". */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "network", "Can't reach the server. Is the backend running?");
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body?.error;
    const detail = Array.isArray(body?.detail) ? body.detail[0]?.msg : undefined;
    throw new ApiError(res.status, err?.code ?? "error", err?.message ?? detail ?? "Something went wrong.");
  }
  return body as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  me: () => request<Me>("/me"),
  updateMe: (
    patch: Partial<{
      display_name: string; daily_goal_xp: number; timezone: string;
      sound_enabled: boolean; animations_enabled: boolean; motivational_messages: boolean; listening_enabled: boolean;
    }>,
  ) =>
    request<Me>("/me", { method: "PATCH", body: JSON.stringify(patch) }),
  refillHearts: (free = false) => post<Me>("/me/hearts/refill", free ? { free: true } : undefined),
  profile: () => request<Profile>("/me/profile"),
  leaderboard: () => request<Leaderboard>("/leaderboard"),
  path: () => request<LearningPath>("/path"),
  claimChest: (unitId: number) => post<{ gems_earned: number; gems: number }>(`/path/units/${unitId}/chest`),

  startSkill: (skillId: number) => post<LessonSession>("/sessions", { mode: "skill", skill_id: skillId }),
  startHeartPractice: () => post<LessonSession>("/sessions", { mode: "heart_practice" }),
  startLegendary: (skillId: number) => post<LessonSession>("/sessions", { mode: "legendary", skill_id: skillId }),
  answer: (sessionId: string, exerciseId: number, answer: Answer) =>
    post<AnswerResult>(`/sessions/${sessionId}/answers`, { exercise_id: exerciseId, ...answer }),
  complete: (sessionId: string) => post<Completion>(`/sessions/${sessionId}/complete`),
  abandon: (sessionId: string) => post<void>(`/sessions/${sessionId}/abandon`),

  devClock: () => request<DevClock>("/dev/clock"),
  devAdvanceDay: () => post<DevClock>("/dev/clock/advance"),
  devSetClock: (offset_days: number) =>
    request<DevClock>("/dev/clock", { method: "PUT", body: JSON.stringify({ offset_days }) }),
  devReset: () => post<void>("/dev/reset"),
};

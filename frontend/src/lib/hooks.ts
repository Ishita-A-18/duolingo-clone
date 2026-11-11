"use client";

import useSWR, { mutate } from "swr";
import { api } from "./api";

// One SWR key per backend read model. Components share the cache, so the top
// bar, path and right rail all update together after a mutation.
export const KEYS = {
  me: "me",
  path: "path",
  profile: "profile",
  leaderboard: "leaderboard",
} as const;

export const useMe = () => useSWR(KEYS.me, api.me, { refreshInterval: 60_000 });
export const usePath = () => useSWR(KEYS.path, api.path);
export const useProfile = () => useSWR(KEYS.profile, api.profile);
export const useLeaderboard = () => useSWR(KEYS.leaderboard, api.leaderboard);

/** Refetch everything that depends on learner progress. */
export function refreshLearnerData() {
  return Promise.all(Object.values(KEYS).map((k) => mutate(k)));
}

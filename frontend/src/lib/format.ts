export function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${Math.max(1, m)} min`;
}

const WEEKDAYS = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];

/** "2026-11-09" -> "Mo" (parsed as a calendar date, no timezone shifts). */
export function weekdayShort(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function joinedLabel(iso: string) {
  return new Date(iso.endsWith("Z") ? iso : `${iso}Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** "2026-11-11" + 1 -> "2026-11-12" (pure calendar math in UTC, no timezone drift). */
export function addDays(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Light / dark / system appearance.
 *
 * The choice is a per-device display preference, so it lives in localStorage
 * (not the database). "system" removes the attribute and lets the CSS
 * prefers-color-scheme media query decide.
 */
export type ThemeMode = "system" | "light" | "dark";

const KEY = "lingo-theme";

export function readThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function applyThemeMode(mode: ThemeMode) {
  try {
    if (mode === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    // storage blocked (private mode): the theme still applies for this page view
  }
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
}

/**
 * Runs inline in <head> before first paint so a saved theme never flashes
 * the wrong colors. Kept tiny and dependency-free on purpose.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

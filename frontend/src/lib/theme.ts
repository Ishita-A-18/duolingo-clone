/**
 * Unit color themes. The backend stores a theme key per unit ("green",
 * "purple", ...); the path, unit banner and node popovers read their colors here.
 */
export interface UnitTheme {
  main: string;
  dark: string;
  light: string;
}

export const UNIT_THEMES: Record<string, UnitTheme> = {
  green: { main: "#58cc02", dark: "#58a700", light: "#d7ffb8" },
  purple: { main: "#ce82ff", dark: "#a568cc", light: "#f4e6ff" },
  blue: { main: "#1cb0f6", dark: "#1899d6", light: "#ddf4ff" },
  orange: { main: "#ff9600", dark: "#e08600", light: "#fff0d9" },
  red: { main: "#ff4b4b", dark: "#ea2b2b", light: "#ffdfe0" },
};

export const unitTheme = (key: string): UnitTheme => UNIT_THEMES[key] ?? UNIT_THEMES.green;

/** Avatar background colors for seeded users. */
export const AVATAR_COLORS: Record<string, string> = {
  blue: "#1cb0f6",
  green: "#58cc02",
  purple: "#ce82ff",
  orange: "#ff9600",
  red: "#ff4b4b",
  pink: "#ff86d0",
  teal: "#2bd9c5",
  yellow: "#ffc800",
};

export const avatarColor = (key: string) => AVATAR_COLORS[key] ?? AVATAR_COLORS.blue;

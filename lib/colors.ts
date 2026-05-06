/** Design palette — pulled from the Boca AI hi-fi mock. */
export const COLORS = {
  primary: "#3f3d8a",
  primaryHover: "#34337a",
  primaryMuted: "#a8a7d2",
  amber: "#b8761c",
  amberSoft: "#fdf3e0",
  amberText: "#e09b3f",
  green: "#3aa55c",
  red: "#dc2626",
  bgPage: "#f0ede8",
  bgSidebar: "#f7f7f8",
  bgSelected: "#ebebf5",
  border: "#e8e8ea",
  borderStrong: "#d8d8db",
  text: "#1a1a1a",
  muted: "#6b6b70",
  dim: "#9a9a9e",
  grid: "#eef0f3",
} as const;

/** Series colors for multi-line charts. */
export const SERIES_COLORS = [
  COLORS.primary,
  COLORS.amber,
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

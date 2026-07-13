/**
 * JS-side mirror of the design tokens defined in app/globals.css. CSS
 * custom properties remain the source of truth for anything rendered in
 * the DOM (components read `var(--gold)` etc. directly); this file exists
 * only for contexts that can't consume CSS variables — Recharts series
 * colors, react-three-fiber materials, canvas/SVG generation.
 *
 * Keep these in sync with app/globals.css by hand; they're intentionally
 * approximate sRGB equivalents of the OKLCH tokens, not a build-time export.
 */
export const THEME_COLORS = {
  light: {
    background: "#FAF8F4",
    foreground: "#241C17",
    primary: "#5C1A28",
    gold: "#C6A567",
    goldLight: "#DCC495",
    goldDark: "#9A7C46",
    muted: "#F1EBE1",
  },
  dark: {
    background: "#1E1712",
    foreground: "#F5EFE4",
    primary: "#8A3446",
    gold: "#D8BC85",
    goldLight: "#E6D3A8",
    goldDark: "#B08F55",
    muted: "#332920",
  },
} as const;

/** Chart series palette (Recharts) — ordered for up to 5 categorical series. */
export const CHART_PALETTE = [
  THEME_COLORS.light.gold,
  THEME_COLORS.light.primary,
  "#5B7A6B",
  "#7A6B93",
  THEME_COLORS.light.goldDark,
] as const;

export const MOTION_EASING_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

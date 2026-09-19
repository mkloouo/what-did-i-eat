const NIGHT = "#12160F";
const DAY = "#2A3428";
const GLOW = "#4A3B28";

export type DayWashGradient = {
  colors: readonly [string, string, ...string[]];
  locations: readonly [number, number, ...number[]];
};

// A smooth astronomical wash across the day — night, a warm dawn, day, a
// warm dusk, night again — used as the Days view's band backdrop. Purely
// decorative: it never counts, scores, or judges a time.
export function dayWashGradient(): DayWashGradient {
  return {
    colors: [NIGHT, NIGHT, GLOW, DAY, DAY, GLOW, NIGHT, NIGHT],
    locations: [
      0,
      5 / 24,
      6 / 24,
      7 / 24,
      18 / 24,
      19 / 24,
      20 / 24,
      1,
    ],
  };
}

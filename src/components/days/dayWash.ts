const NIGHT = "#2B2742";
const DAWN = "#D9B784";
const DAYLIGHT = "#E4DFE9";
const DUSK_TAN = "#D7B48C";
const DUSK_PURPLE = "#6E6386";

export type DayWashGradient = {
  colors: readonly [string, string, ...string[]];
  locations: readonly [number, number, ...number[]];
};

// A smooth astronomical wash across the day — night, a warm dawn, daylight, a
// warm dusk fading through purple, night again — used as the Days view's band
// backdrop. Purely decorative: it never counts, scores, or judges a time.
export function dayWashGradient(): DayWashGradient {
  return {
    colors: [
      NIGHT,
      NIGHT,
      DAWN,
      DAYLIGHT,
      DAYLIGHT,
      DUSK_TAN,
      DUSK_PURPLE,
      NIGHT,
    ],
    locations: [0, 5 / 24, 6 / 24, 7 / 24, 18 / 24, 19 / 24, 20 / 24, 1],
  };
}

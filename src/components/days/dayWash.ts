/*
New colors:
00:00 – Midnight: Deep Navy / Obsidian (#0F172A)
05:00 – Pre-dawn: Soft Indigo (#312E81)
06:30 – Sunrise: Warm Coral & Gold (#F97316 to #FCD34D)
12:00 – Midday: Bright Sky Blue (#38BDF8)
17:30 – Sunset: Rich Magenta & Amber (#E11D48 to #F59E0B)
20:00 – Dusk: Twilight Purple (#4C1D95)
24:00 – Midnight: Deep Navy (#0F172A)

Thanks, Gemini.
*/
const MIDNIGHT = "#0F172A"
const PRE_DAWN = "#312E81"
const SUNRISE_A = "#F97316"
const SUNRISE_B = "#FCD34D"
const MIDDAY = "#38BDF8"
const SUNSET_A = "#E11D48"
const SUNSET_B = "#F59E0B"
const DUSK = "#4C1D95"

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
      MIDNIGHT,
      PRE_DAWN,
      SUNRISE_A,
      SUNRISE_B,
      MIDDAY,
      SUNSET_A,
      SUNSET_B,
      DUSK,
      MIDNIGHT
    ],
    locations: [0, 5 / 24, 6 / 24, 7 / 24, 12 / 24, 17.5 / 24, 19 / 24, 21 / 24, 1],
  };
}

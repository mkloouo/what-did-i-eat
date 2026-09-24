// Daybands light: time of day is the app's only axis, so the palette reads
// like daylight — see docs/superpowers/specs for the design system this was
// pulled from. Roles, not raw swatches: `accent`/`chip`+`chipText` are the
// only colours legible as small text/icons or filled pills at 4.5:1 against
// `daylight`/`surface` — see theme.test.ts. `pine` and `sun` are decorative
// only (gradients, ticks, markers), never text or a fill with text on it.
export const colors = {
  daylight: "#E8E3EC",
  surface: "#DED7E6",
  hairline: "#D2CAD8",
  ink: "#241F33",
  inkMuted: "#3B3550",
  graphite: "#5A5668",
  pine: "#2A7F62",
  sun: "#E0A73C",
  accent: "#1F6349",
  chip: "#D5E2DB",
  chipText: "#1F4436",
  clay: "#8E3B37",
  // A lighter clay, for danger text on the photo viewer's dark overlay chrome
  // (the one place that keeps a dark bar / light text pairing — see its
  // usage sites) — the plain `clay` is too dark to read there.
  clayOnDark: "#DE7B73",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 2,
  md: 3,
  lg: 4,
  pill: 999,
} as const;

// One family name per weight: on Android a custom font's weight comes from its
// family name, so styles must never combine these with fontWeight. `voice` is
// the one place the user's own words appear (comments) — every other string
// in the app speaks in the sans family.
export const fonts = {
  regular: "IBMPlexSansCondensed_400Regular",
  medium: "IBMPlexSansCondensed_500Medium",
  semibold: "IBMPlexSansCondensed_600SemiBold",
  bold: "IBMPlexSansCondensed_700Bold",
  voice: "Newsreader_400Regular",
  voiceMedium: "Newsreader_500Medium",
} as const;

export const typography = {
  title: { fontFamily: fonts.semibold, fontSize: 22 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 16 },
  body: { fontFamily: fonts.regular, fontSize: 15 },
  caption: { fontFamily: fonts.regular, fontSize: 13 },
  time: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    // Asserted as a mutable tuple: React Native's fontVariant type rejects the
    // readonly array that the outer `as const` would otherwise produce.
    fontVariant: ["tabular-nums"] as ["tabular-nums"],
  },
  // The user's own words — comments, wherever they're shown or typed.
  voice: { fontFamily: fonts.voice, fontSize: 17, lineHeight: 24 },
} as const;

export const theme = { colors, spacing, radii, fonts, typography };
export type Theme = typeof theme;

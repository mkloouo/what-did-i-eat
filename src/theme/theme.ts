// Citrus: a sunny cream ground with orange for everything that's "yours" —
// the Line's spine, tags, and the filled buttons. Roles, not raw swatches:
// `accent`/`chip`+`chipText` are the only colours legible as small
// text/icons or filled pills at 4.5:1 against `daylight`/`surface`, and
// `primary` is the fill behind `daylight` button labels — see theme.test.ts.
// `pine` (the name predates Citrus; it's the bright orange now) is
// decorative only (the spine, dots, markers), never text or a fill with
// text on it.
export const colors = {
  daylight: "#FFFCF3",
  surface: "#FFF3D1",
  hairline: "#F3E4B8",
  ink: "#2A2417",
  graphite: "#675C43",
  pine: "#F59E0B",
  accent: "#A84B00",
  primary: "#A84B00",
  chip: "#FFE8B0",
  chipText: "#7A3E00",
  clay: "#B42318",
  // A lighter clay, for danger text on the photo viewer's dark overlay chrome
  // (the one place that keeps a dark bar / light text pairing — see its
  // usage sites) — the plain `clay` is too dark to read there.
  clayOnDark: "#DE7B73",
} as const;

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

const radii = {
  sm: 2,
  md: 3,
  lg: 4,
  pill: 999,
} as const;

// One family name per weight: on Android a custom font's weight comes from its
// family name, so styles must never combine these with fontWeight. `voice` is
// the one place the user's own words appear (comments) — every other string
// in the app speaks in the sans family. Both families were chosen (over the
// condensed IBM Plex Sans cut and Newsreader, respectively) specifically
// because their official static files include Cyrillic glyphs — the earlier
// choices had none, in any weight, so Cyrillic text fell back to the system
// font mid-string.
export const fonts = {
  regular: "IBMPlexSans_400Regular",
  medium: "IBMPlexSans_500Medium",
  semibold: "IBMPlexSans_600SemiBold",
  bold: "IBMPlexSans_700Bold",
  voice: "Lora_400Regular",
  voiceMedium: "Lora_500Medium",
} as const;

const typography = {
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

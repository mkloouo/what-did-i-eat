const base = {
  wall: "#1C2320",
  seam: "#252D29",
  hairline: "#3A443E",
  bone: "#EDE8DC",
  chalk: "#949E97",
  brass: "#B08A4A",
  clay: "#DE7B73",
} as const;

export const colors = {
  ...base,
  // Legacy names, remapped so screens that have not been redesigned yet still
  // pick up the Wall look. Each redesign step moves screens onto the names
  // above; 2.0.0 deletes these.
  background: base.wall,
  surface: base.seam,
  primary: base.brass,
  secondary: base.hairline,
  muted: base.chalk,
  accentDark: base.wall,
  text: base.bone,
  textOnDark: base.bone,
  danger: base.clay,
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
// family name, so styles must never combine these with fontWeight.
export const fonts = {
  regular: "InstrumentSans_400Regular",
  medium: "InstrumentSans_500Medium",
  semibold: "InstrumentSans_600SemiBold",
  bold: "InstrumentSans_700Bold",
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
} as const;

export const theme = { colors, spacing, radii, fonts, typography };
export type Theme = typeof theme;

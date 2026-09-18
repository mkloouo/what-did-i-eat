export const colors = {
  background: '#DFD9E2',
  surface: '#F7F5F9',
  primary: '#2A7F62',
  secondary: '#C3ACCE',
  muted: '#89909F',
  accentDark: '#538083',
  text: '#2A2A2E',
  textOnDark: '#F7F5F9',
  danger: '#B3413A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

export const theme = { colors, spacing, radii, typography, shadows };
export type Theme = typeof theme;

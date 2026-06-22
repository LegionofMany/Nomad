export const nomadColors = {
  background: '#02070d',
  surface: 'rgba(3, 18, 25, 0.94)',
  surfaceStrong: 'rgba(3, 16, 30, 0.98)',
  border: '#0d332d',
  borderBlue: '#0a3862',
  blue: '#1494ff',
  green: '#22f36d',
  purple: '#8b5cff',
  amber: '#ffb020',
  red: '#ff4b4b',
  muted: '#c5c7d1',
  mutedBlue: '#8ba8ca',
  white: '#ffffff',
} as const;

export const nomadSpacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const nomadRadii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const nomadTypography = {
  title: 31,
  section: 21,
  body: 16,
  small: 12,
} as const;

export const nomadTheme = {
  colors: nomadColors,
  spacing: nomadSpacing,
  radii: nomadRadii,
  typography: nomadTypography,
} as const;

export type NomadTheme = typeof nomadTheme;

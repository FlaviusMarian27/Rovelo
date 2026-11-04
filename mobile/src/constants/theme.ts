// Singura sursă de culori, spațieri și fonturi. Nu hardcoda culori în ecrane.

export const colors = {
  primary: '#BF1C21', // roșul din iconiță (docs/icon.png)
  primaryPressed: '#A3171B',
  primarySoft: '#FBEBEC', // fundal deschis pentru iconițe/badge-uri roșii
  onPrimary: '#FFFFFF',

  background: '#FFFFFF',
  surface: '#F6F6F7',
  border: '#E4E4E7',
  borderFocus: '#A1A1AA',

  text: '#18181B',
  textSecondary: '#71717A',
  textMuted: '#A1A1AA',

  error: '#BF1C21',

  // Punctul albastru "tu ești aici" de pe hartă (convenția din toate aplicațiile de hărți)
  userLocation: '#2F6FED',
  userLocationHalo: 'rgba(47, 111, 237, 0.18)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 28,
  full: 999,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 34,
} as const;

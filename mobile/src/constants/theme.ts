// Singura sursă de culori, spațieri și fonturi. Nu hardcoda culori în ecrane.

// Fiecare ecran își ia culorile din useTheme() / makeStyles (context/theme.tsx),
// așa că tema se schimbă peste tot deodată. Ambele palete au aceleași chei.
export const lightColors = {
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
  backdrop: 'rgba(0, 0, 0, 0.35)', // în spatele panourilor (bottom sheet, meniu)
  shadow: '#000000',

  // Punctul albastru "tu ești aici" de pe hartă (convenția din toate aplicațiile de hărți)
  userLocation: '#2F6FED',
  userLocationHalo: 'rgba(47, 111, 237, 0.18)',
};

export type Colors = typeof lightColors;

// Tema întunecată: gri aproape negru, nu negru pur; roșul puțin mai deschis ca să se vadă pe întuneric.
export const darkColors: Colors = {
  primary: '#E5484D',
  primaryPressed: '#C8373C',
  primarySoft: '#3A1E20',
  onPrimary: '#FFFFFF',

  background: '#111113',
  surface: '#1C1C1F',
  border: '#2E2E33',
  borderFocus: '#5B5B63',

  text: '#F4F4F5',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  error: '#F2555A',
  backdrop: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',

  userLocation: '#4F8BFF',
  userLocationHalo: 'rgba(79, 139, 255, 0.25)',
};

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

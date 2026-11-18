// Tema aplicației: light / dark / "ca telefonul".
// Alegerea se ține pe telefon (AsyncStorage, merge și pentru guest și înainte de login)
// și, pentru conturi, pe server (PUT /api/me/preferences), ca să te urmeze pe alt telefon.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { darkColors, lightColors, type Colors } from '@/constants/theme';
import { useSession } from '@/context/session';
import type { ThemePreference } from '@/types';

type ThemeContextValue = {
  colors: Colors;
  scheme: 'light' | 'dark'; // tema efectivă
  preference: ThemePreference; // ce a ales userul
  setPreference: (p: ThemePreference) => Promise<boolean>;
};

const STORAGE_KEY = 'rovelo.theme';
const isPreference = (v: unknown): v is ThemePreference =>
  v === 'system' || v === 'light' || v === 'dark';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const { user, updatePreferences } = useSession();
  const [preference, setLocal] = useState<ThemePreference>('system');

  // La pornire: ce era ales ultima dată pe telefonul ăsta
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => isPreference(saved) && setLocal(saved))
      .catch(() => {});
  }, []);

  // După login / restaurarea sesiunii, contează ce e pe server
  const serverTheme = user && !user.isGuest ? user.theme : null;
  useEffect(() => {
    if (!serverTheme) return;
    setLocal(serverTheme);
    AsyncStorage.setItem(STORAGE_KEY, serverTheme).catch(() => {});
  }, [serverTheme]);

  async function setPreference(p: ThemePreference) {
    const previous = preference;
    setLocal(p); // imediat, fără să așteptăm serverul
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
    if (!user) return true;
    const res = await updatePreferences({ theme: p });
    if (!res.ok) {
      setLocal(previous);
      AsyncStorage.setItem(STORAGE_KEY, previous).catch(() => {});
    }
    return res.ok;
  }

  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, scheme, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme trebuie folosit în <ThemeProvider>');
  return ctx;
}

/**
 * Ca StyleSheet.create, dar cu culorile temei curente:
 *   const useStyles = makeStyles((colors) => ({ box: { backgroundColor: colors.surface } }));
 *   // în componentă: const styles = useStyles();
 * Stilurile se creează o singură dată per temă.
 */
type NamedStyles = Parameters<typeof StyleSheet.create>[0];

export function makeStyles<S extends NamedStyles>(factory: (colors: Colors) => S & NamedStyles) {
  const cache = new Map<Colors, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const { colors } = useTheme();
    const cached = cache.get(colors);
    if (cached) return cached;
    const created = StyleSheet.create(factory(colors));
    cache.set(colors, created);
    return created;
  };
}

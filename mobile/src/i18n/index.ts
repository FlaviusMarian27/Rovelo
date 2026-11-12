// Traduceri (i18next). Limba: cea aleasă în Profile → Language (salvată pe telefon),
// altfel limba telefonului dacă o avem, altfel engleza.
// O limbă nouă = un fișier nou (ex. de.ts) + o intrare în LANGUAGES.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './de';
import en from './en';
import es from './es';
import fr from './fr';
import hu from './hu';
import it from './it';
import ro from './ro';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ro', label: 'Română' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'hu', label: 'Magyar' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'rovelo.language';

const isSupported = (code?: string | null): code is LanguageCode =>
  LANGUAGES.some((l) => l.code === code);

const deviceLanguage = getLocales()[0]?.languageCode;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ro: { translation: ro },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
    it: { translation: it },
    hu: { translation: hu },
  },
  lng: isSupported(deviceLanguage) ? deviceLanguage : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React escapează deja
  returnNull: false,
});

// Limba aleasă manual are prioritate față de limba telefonului.
AsyncStorage.getItem(STORAGE_KEY)
  .then((saved) => {
    if (isSupported(saved) && saved !== i18n.language) i18n.changeLanguage(saved);
  })
  .catch(() => {});

export async function setLanguage(code: LanguageCode) {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // dacă nu se poate salva, rămâne doar pentru sesiunea curentă
  }
}

export default i18n;

// Traduceri (i18next). Limba: cea aleasă în Profile → Language (salvată pe telefon),
// altfel limba telefonului dacă o avem, altfel engleza.
// O limbă nouă = un fișier nou (ex. de.ts) + o intrare în LANGUAGES.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en';
import ro from './ro';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ro', label: 'Română' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'rovelo.language';

const isSupported = (code?: string | null): code is LanguageCode =>
  LANGUAGES.some((l) => l.code === code);

const deviceLanguage = getLocales()[0]?.languageCode;

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ro: { translation: ro } },
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

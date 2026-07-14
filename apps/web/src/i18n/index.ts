import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hy from './hy.json';

export const SUPPORTED_LOCALES = [
  { code: 'hy', label: 'Հայերեն' },
  { code: 'en', label: 'English' },
] as const;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hy: { translation: hy },
  },
  lng: localStorage.getItem('rehab-locale') ?? 'hy',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLocale(code: string): void {
  localStorage.setItem('rehab-locale', code);
  void i18n.changeLanguage(code);
}

export default i18n;

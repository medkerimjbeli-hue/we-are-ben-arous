import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import fr from './locales/fr';
import ar from './locales/ar';
import adminEn from './locales/admin.en';
import adminFr from './locales/admin.fr';
import adminAr from './locales/admin.ar';
import { LANGS, type Lang } from '../../types';

export const DEFAULT_LANG: Lang = 'en';
export const LANG_STORAGE_KEY = 'wab.lang';
export const ADMIN_LANG_STORAGE_KEY = 'wab.adminLang';
export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as readonly string[]).includes(v);
export const dirFor = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr');

/** Preferred language: saved preference, then browser language, then English. */
export function preferredLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch { /* storage unavailable */ }
  const nav = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  for (const l of nav) { const short = l?.slice(0, 2); if (isLang(short)) return short; }
  return DEFAULT_LANG;
}

export function applyLang(lang: Lang) {
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = dirFor(lang);
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch { /* ignore */ }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...en, admin: adminEn } },
    fr: { translation: { ...fr, admin: adminFr } },
    ar: { translation: { ...ar, admin: adminAr } },
  },
  lng: DEFAULT_LANG,
  fallbackLng: { ar: ['fr', 'en'], fr: ['en'], default: ['en'] },
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;

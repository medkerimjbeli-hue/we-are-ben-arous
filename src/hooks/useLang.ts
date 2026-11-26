import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '../types';
import { isLang, DEFAULT_LANG } from '../features/i18n/i18n';

/** Current language and a helper that prefixes app paths with it. */
export function useLang() {
  const { i18n } = useTranslation();
  const lang: Lang = isLang(i18n.language) ? i18n.language : DEFAULT_LANG;
  const to = useCallback((path = '') => (path ? `/${lang}/${path.replace(/^\//, '')}` : `/${lang}`), [lang]);
  return { lang, to, dir: lang === 'ar' ? 'rtl' : 'ltr' } as const;
}

export const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`;

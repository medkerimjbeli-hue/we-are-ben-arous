import type { Lang, Localized } from '../types';

const FALLBACK: Record<Lang, Lang[]> = { en: ['en', 'fr', 'ar'], fr: ['fr', 'en', 'ar'], ar: ['ar', 'fr', 'en'] };

/** Returns the text in the requested language, falling back sensibly. `lang` tells which language was used. */
export function pick(value: Localized | null | undefined, lang: Lang): { text: string; lang: Lang | null } {
  if (value) for (const l of FALLBACK[lang]) { const t = value[l]?.trim(); if (t) return { text: t, lang: l }; }
  return { text: '', lang: null };
}
export const tr = (value: Localized | null | undefined, lang: Lang) => pick(value, lang).text;

export function missingLangs(value: Localized | null | undefined): Lang[] {
  return (['en', 'fr', 'ar'] as Lang[]).filter((l) => !value?.[l]?.trim());
}

/** Accent/case-insensitive normalisation that also handles Arabic diacritics and letter variants. */
export function normalizeSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ً-ٰٟـ]/g, '') // Arabic harakat, superscript alef, tatweel
    .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .toLowerCase().trim();
}

export function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { LANGS, type Lang } from '../types';
import { useLang } from '../hooks/useLang';

const LABEL: Record<Lang, string> = { en: 'EN', fr: 'FR', ar: 'عربي' };
const FULL: Record<Lang, string> = { en: 'English', fr: 'Français', ar: 'العربية' };

/** Switches language by rewriting the language segment of the current URL (keeps the visitor on the same page). */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const go = (l: Lang) => navigate(pathname.replace(/^\/(en|fr|ar)(?=\/|$)/, `/${l}`) + search + hash);
  return (
    <div role="group" aria-label={t('nav.language')} className={`flex items-center gap-1 rounded-full border border-line p-1 ${className}`}>
      {LANGS.map((l) => (
        <button key={l} type="button" lang={l} onClick={() => go(l)} aria-pressed={l === lang} aria-label={FULL[l]}
          className={`min-h-9 min-w-10 rounded-full px-2.5 text-xs font-bold transition ${l === lang ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}>
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}

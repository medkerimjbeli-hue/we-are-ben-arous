import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { asset } from '../hooks/useLang';

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || '';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = content;
}
function setLink(rel: string, href: string | null, hreflang?: string) {
  const sel = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!href) { el?.remove(); return; }
  if (!el) { el = document.createElement('link'); el.rel = rel; if (hreflang) el.hreflang = hreflang; document.head.appendChild(el); }
  el.href = href;
}

/** Sets localized title, description, Open Graph/Twitter tags and (when the public URL is known) canonical + hreflang. */
export function Seo({ title, description, image }: { title?: string; description?: string; image?: string | null }) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  useEffect(() => {
    const full = title ? `${title} · ${t('meta.siteName')}` : t('meta.defaultTitle');
    const desc = description || t('meta.description');
    document.title = full;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:locale', { en: 'en_US', fr: 'fr_FR', ar: 'ar_TN' }[i18n.language] ?? 'en_US');
    const img = image || asset('og-image.jpg');
    setMeta('property', 'og:image', SITE_URL && img.startsWith('/') ? `${new URL(SITE_URL).origin}${img}` : img);
    setMeta('name', 'twitter:title', full);
    setMeta('name', 'twitter:description', desc);
    if (SITE_URL) {
      const rest = pathname.replace(/^\/(en|fr|ar)(?=\/|$)/, '');
      setLink('canonical', `${SITE_URL}${pathname}`);
      setMeta('property', 'og:url', `${SITE_URL}${pathname}`);
      for (const l of ['en', 'fr', 'ar']) setLink('alternate', `${SITE_URL}/${l}${rest}`, l);
    }
  }, [title, description, image, t, i18n.language, pathname]);
  return null;
}

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, MapPinOff } from 'lucide-react';
import { Instagram } from '../../components/InstagramIcon';
import type { Catalog, Location } from '../../types';
import { tr } from '../../lib/localize';
import { useLang } from '../../hooks/useLang';
import { categoryById, delegationById, hasVerifiedCoords, mediaById, postsForLocation } from '../../data/selectors';

export function LocationCard({ location: l, catalog: c, compact = false }: { location: Location; catalog: Catalog; compact?: boolean }) {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const d = delegationById(c, l.delegationId);
  const cat = categoryById(c, l.categoryId);
  const cover = mediaById(c, l.coverMediaId);
  const posts = postsForLocation(c, l.id);
  const summary = tr(l.summary, lang);
  return (
    <article className="group card relative flex flex-col overflow-hidden transition hover:border-primary/70">
      <div className={`relative ${compact ? 'aspect-[16/9]' : 'aspect-[4/3]'} overflow-hidden bg-ink-3`}>
        {cover?.url ? (
          <img src={cover.url} alt={tr(cover.alt, lang)} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div aria-hidden className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(240,0,46,.35),transparent_55%),linear-gradient(160deg,#1c1c1c,#0a0a0a)]">
            <span className="font-display text-5xl font-extrabold text-white/10" dir="auto">{tr(l.name, lang).slice(0, 2)}</span>
          </div>
        )}
        <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
          {l.kind === 'story' && <span className="chip border-transparent bg-ink/80 text-white">{t('place.story_kind')}</span>}
          {cat && <span className="chip border-transparent bg-ink/80 text-white">{tr(cat.name, lang)}</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          {hasVerifiedCoords(l) ? <MapPin className="h-3.5 w-3.5" aria-hidden /> : <MapPinOff className="h-3.5 w-3.5" aria-hidden />}
          {d ? tr(d.name, lang) : ''}
        </p>
        <h3 className="text-xl font-bold" dir="auto">
          <Link to={to(`places/${l.slug}`)} className="after:absolute after:inset-0 focus-visible:outline-none">{tr(l.name, lang)}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted" dir="auto">{summary || t('common.comingSoon')}</p>
        {posts.length > 0 && (
          <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted"><Instagram className="h-3.5 w-3.5 text-primary" aria-hidden /> {t('place.instagramCount', { count: posts.length })}</p>
        )}
      </div>
    </article>
  );
}

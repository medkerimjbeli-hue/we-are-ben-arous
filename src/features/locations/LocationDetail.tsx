import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Link2, MapPin, MapPinOff, Share2 } from 'lucide-react';
import type { Catalog, Location } from '../../types';
import { pick, tr } from '../../lib/localize';
import { useLang } from '../../hooks/useLang';
import { categoryById, delegationById, hasVerifiedCoords, locationsInDelegation, mediaById, postsForLocation, storiesForPlace } from '../../data/selectors';
import { InstagramEmbed } from '../instagram/InstagramEmbed';
import { LocationCard } from './LocationCard';

const MapView = lazy(() => import('../map/MapView'));

/** Full location/story view. Used by the public detail route and the admin preview. */
export function LocationDetail({ location: l, catalog: c, preview = false }: { location: Location; catalog: Catalog; preview?: boolean }) {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const [copied, setCopied] = useState(false);
  const d = delegationById(c, l.delegationId);
  const cat = categoryById(c, l.categoryId);
  const cover = mediaById(c, l.coverMediaId);
  const gallery = c.media.filter((m) => m.locationId === l.id && m.id !== l.coverMediaId);
  const posts = postsForLocation(c, l.id);
  const stories = storiesForPlace(c, l.id);
  const aboutPlace = l.kind === 'story' && l.placeId ? c.locations.find((x) => x.id === l.placeId) ?? null : null;
  const related = d ? locationsInDelegation(c, d.id).filter((x) => x.id !== l.id && !stories.includes(x)).slice(0, 3) : [];
  const summary = pick(l.summary, lang), story = pick(l.story, lang), name = tr(l.name, lang);
  const fallbackNote = (used: string | null) => used && used !== lang
    ? <p className="mb-2 text-xs text-muted">{t('common.translationFallback', { lang: t(`common.langNames.${used}`) })}</p> : null;

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  const share = async () => {
    const url = window.location.href;
    try {
      if (canShare) await navigator.share({ title: name, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };

  return (
    <article>
      <header className="grain relative overflow-hidden border-b border-line">
        {cover?.url ? (
          <img src={cover.url} alt={tr(cover.alt, lang)} className="absolute inset-0 h-full w-full object-cover opacity-50" />
        ) : <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(240,0,46,.35),transparent_60%)]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-16 sm:px-6 sm:pt-28">
          {!preview && (
            <Link to={d ? to(`explore/ben-arous/${d.slug}`) : to('explore/ben-arous')} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /> {t('place.backToMap')}
            </Link>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="chip border-primary/60 text-white">{l.kind === 'story' ? t('place.story_kind') : t('place.place_kind')}</span>
            {d && <span className="chip">{t('place.delegation')}: {tr(d.name, lang)}</span>}
            {cat && <span className="chip">{tr(cat.name, lang)}</span>}
          </div>
          <h1 className="text-4xl font-extrabold sm:text-6xl" dir="auto">{name}</h1>
          {aboutPlace && (
            <p className="mt-3 text-muted">{t('place.aboutPlace')}{' '}
              <Link to={to(`places/${aboutPlace.slug}`)} className="font-semibold text-white underline decoration-primary underline-offset-4" dir="auto">{tr(aboutPlace.name, lang)}</Link>
            </p>
          )}
          {tr(l.address, lang) && <p className="mt-3 text-muted" dir="auto">{tr(l.address, lang)}</p>}
          {!preview && (
            <button type="button" onClick={share} className="btn btn-ghost mt-6">
              {copied ? <Check className="h-4 w-4" aria-hidden /> : canShare ? <Share2 className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
              {copied ? t('common.copied') : canShare ? t('common.share') : t('common.copyLink')}
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div>
          <section aria-labelledby="sum">
            <h2 id="sum" className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-primary">{t('place.summary')}</h2>
            {fallbackNote(summary.lang)}
            <p className="text-xl leading-relaxed" dir="auto">{summary.text || t('common.comingSoon')}</p>
          </section>
          {story.text && (
            <section aria-labelledby="story" className="mt-10">
              <h2 id="story" className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-primary">{t('place.story')}</h2>
              {fallbackNote(story.lang)}
              <div className="space-y-4 text-lg leading-relaxed text-white/90" dir="auto">
                {story.text.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </section>
          )}
          {gallery.length > 0 && (
            <section className="mt-10 grid grid-cols-2 gap-3">
              {gallery.map((m) => (
                <figure key={m.id}>
                  <img src={m.url} alt={tr(m.alt, lang)} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                  {m.credit && <figcaption className="mt-1 text-xs text-muted">© {m.credit}</figcaption>}
                </figure>
              ))}
            </section>
          )}
          {posts.length > 0 && (
            <section aria-labelledby="ig" className="mt-10">
              <h2 id="ig" className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-primary">{t('place.instagram')}</h2>
              <div className="grid gap-5 sm:grid-cols-2">{posts.map((p) => <InstagramEmbed key={p.id} post={p} />)}</div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <div className="card overflow-hidden">
            <h2 className="flex items-center gap-2 p-4 font-display text-sm font-bold">
              {hasVerifiedCoords(l) ? <MapPin className="h-4 w-4 text-primary" aria-hidden /> : <MapPinOff className="h-4 w-4 text-muted" aria-hidden />} {t('place.position')}
            </h2>
            {hasVerifiedCoords(l) ? (
              <>
                <Suspense fallback={<div className="h-56" />}>
                  <MapView mode="region" lang={lang} selectedDelegationId={l.delegationId} pins={[{ id: l.id, lat: l.lat!, lng: l.lng!, label: name }]} selectedPinId={l.id} className="h-56 !rounded-none !border-0 !border-t" />
                </Suspense>
                <a className="block p-4 text-sm underline decoration-primary underline-offset-4" target="_blank" rel="noopener noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=17/${l.lat}/${l.lng}`}>{t('place.openInOsm')}</a>
              </>
            ) : <p className="px-4 pb-4 text-sm text-muted">{t('place.positionUnverified')}</p>}
          </div>
          {(cover?.credit || cover?.sourceUrl) && (
            <div className="card p-4 text-sm">
              <h2 className="mb-2 font-display font-bold">{t('place.credits')}</h2>
              {cover.credit && <p className="text-muted">{t('place.photo')}: © {cover.credit}</p>}
              {cover.sourceUrl && <a href={cover.sourceUrl} target="_blank" rel="noopener noreferrer" className="break-all text-muted underline">{cover.sourceUrl}</a>}
            </div>
          )}
        </aside>
      </div>

      {!preview && stories.length > 0 && (
        <section className="mx-auto mb-12 max-w-5xl px-4 sm:px-6">
          <h2 className="mb-5 text-2xl font-extrabold">{t('place.relatedStories')}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{stories.map((r) => <LocationCard key={r.id} location={r} catalog={c} compact />)}</div>
        </section>
      )}
      {!preview && related.length > 0 && d && (
        <section className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="mb-5 text-2xl font-extrabold">{t('place.related', { name: tr(d.name, lang) })}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <LocationCard key={r.id} location={r} catalog={c} compact />)}</div>
        </section>
      )}
    </article>
  );
}

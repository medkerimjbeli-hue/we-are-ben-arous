import { lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Compass, Heart, Landmark } from 'lucide-react';
import { Instagram } from '../components/InstagramIcon';
import { useCatalog } from '../data/CatalogProvider';
import { delegationById, featuredPosts } from '../data/selectors';
import { asset, useLang } from '../hooks/useLang';
import { tr } from '../lib/localize';
import { Seo } from '../components/Seo';
import { Empty } from '../components/States';
import { DelegationCarousel } from '../features/home/DelegationCarousel';
import { LocationCard } from '../features/locations/LocationCard';
import { InstagramEmbed } from '../features/instagram/InstagramEmbed';
import { INSTAGRAM_PROFILE } from '../features/instagram/instagram';
import { AVAILABLE_GOVERNORATES } from '../features/map/geo';

const MapView = lazy(() => import('../features/map/MapView'));

export default function HomePage() {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const navigate = useNavigate();
  const c = useCatalog().catalog!;
  const highlighted = [...c.locations].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 6);
  const { posts, curated } = featuredPosts(c, 5);

  return (
    <>
      <Seo />
      {/* Hero */}
      <section className="grain relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_110%,rgba(240,0,46,.35),transparent_60%),radial-gradient(ellipse_at_10%_0%,rgba(139,0,27,.35),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-16">
          <div className="rise text-center lg:text-start">
            <img src={asset('brand/logo-512.webp')} alt="We Are Ben Arous" width={512} height={512} className="mx-auto mb-6 h-32 w-32 drop-shadow-[0_10px_40px_rgba(240,0,46,.45)] sm:h-40 sm:w-40 lg:mx-0" />
            <p className="mb-3 text-xs font-bold uppercase tracking-[.3em] text-primary">{t('home.eyebrow')}</p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">{t('brand.slogan')}</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted lg:mx-0">{t('home.heroLead')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link to={to('explore/ben-arous')} className="btn btn-primary">{t('home.ctaExplore')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Link>
              <Link to={to('places')} className="btn btn-ghost">{t('home.ctaPlaces')}</Link>
            </div>
          </div>
          <div className="rise" style={{ animationDelay: '.15s' }}>
            <p className="mb-1 text-center font-display text-sm font-bold uppercase tracking-[.2em] text-muted">{t('home.carouselTitle')}</p>
            <DelegationCarousel catalog={c} />
          </div>
        </div>
      </section>

      {/* Principle */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <p className="font-display text-2xl font-bold leading-snug sm:text-4xl">“{t('brand.principle')}”</p>
      </section>

      {/* Map */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="map-title">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 id="map-title" className="text-3xl font-extrabold sm:text-4xl">{t('home.mapTitle')}</h2>
            <p className="mt-4 text-lg text-muted">{t('home.mapLead')}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="chip"><span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden /> {t('map.available')}</span>
              <span className="chip"><span className="h-2.5 w-2.5 rounded-full border border-muted bg-ink-3" aria-hidden /> {t('map.comingSoon')}</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={to('explore/ben-arous')} className="btn btn-primary">{t('map.enter')}</Link>
              <Link to={to('explore')} className="btn btn-ghost">{t('home.ctaExplore')}</Link>
            </div>
          </div>
          <Suspense fallback={<div className="h-[520px] rounded-3xl border border-line" />}>
            <MapView mode="country" lang={lang} className="h-[480px] sm:h-[560px]"
              onGovernorate={(id) => navigate(AVAILABLE_GOVERNORATES.has(id) ? to('explore/ben-arous') : to('explore'))} />
          </Suspense>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6" aria-labelledby="why-title">
        <h2 id="why-title" className="mb-10 text-3xl font-extrabold sm:text-4xl">{t('home.whyTitle')}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {[[Landmark, 'why1'], [Heart, 'why2'], [Compass, 'why3']].map(([Icon, k], i) => {
            const I = Icon as typeof Landmark;
            return (
              <div key={k as string} className="card relative overflow-hidden p-7">
                <span className="absolute -end-4 -top-6 font-display text-[7rem] font-extrabold text-white/[.04]" aria-hidden>{i + 1}</span>
                <I className="mb-5 h-8 w-8 text-primary" aria-hidden />
                <p className="text-lg font-semibold leading-snug">{t(`home.${k as string}`)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Discoveries */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="disc-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="disc-title" className="text-3xl font-extrabold sm:text-4xl">{t('home.featuredTitle')}</h2>
            <p className="mt-2 text-muted">{t('home.featuredLead')}</p>
          </div>
          <Link to={to('places')} className="btn btn-ghost">{t('home.seeAll')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Link>
        </div>
        {highlighted.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{highlighted.map((l) => <LocationCard key={l.id} location={l} catalog={c} />)}</div>
        ) : <Empty>{t('search.noResults')}</Empty>}
      </section>

      {/* Instagram */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6" aria-labelledby="ig-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="ig-title" className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
              {curated ? t('home.instaFeatured') : t('home.instaTitle')}
            </h2>
            <p className="mt-2 text-muted">{t('home.instaLead')}</p>
          </div>
          <a href={INSTAGRAM_PROFILE} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Instagram className="h-4 w-4" aria-hidden /> <span dir="ltr">@we_are_ben_arous</span></a>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {posts.map((p) => <InstagramEmbed key={p.id} post={p} subtitle={tr(delegationById(c, p.delegationId)?.name, lang)} />)}
        </div>
      </section>

      {/* Mission / vision */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grain relative grid overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-accent/50 via-ink-2 to-ink md:grid-cols-2">
          <div className="p-8 sm:p-12">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.3em] text-primary">{t('home.missionTitle')}</p>
            <p className="font-display text-2xl font-extrabold sm:text-3xl">{t('brand.mission')}</p>
            <p className="mt-4 text-muted">{t('home.missionBody')}</p>
          </div>
          <div className="border-t border-line p-8 sm:p-12 md:border-s md:border-t-0">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.3em] text-primary">{t('home.visionTitle')}</p>
            <p className="text-lg text-white/90">{t('home.visionBody')}</p>
            <Link to={to('about')} className="btn btn-ghost mt-6">{t('nav.about')}</Link>
          </div>
        </div>
      </section>
    </>
  );
}

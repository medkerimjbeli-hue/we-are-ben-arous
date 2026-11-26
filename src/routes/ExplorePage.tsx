import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Lock, MapPin, MapPinOff, Unlock } from 'lucide-react';
import { useCatalog } from '../data/CatalogProvider';
import { delegationById, delegationBySlug, delegationOnlyPosts, hasVerifiedCoords, locationsInDelegation, categoryById, mediaById } from '../data/selectors';
import { useLang } from '../hooks/useLang';
import { tr } from '../lib/localize';
import { Seo } from '../components/Seo';
import { Dialog } from '../components/Dialog';
import { Empty, Loading } from '../components/States';
import { InstagramEmbed } from '../features/instagram/InstagramEmbed';
import { AVAILABLE_GOVERNORATES, geoName, loadGovernorates, type GovFC } from '../features/map/geo';
import NotFoundPage from './NotFoundPage';

const MapView = lazy(() => import('../features/map/MapView'));

export default function ExplorePage() {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const { pathname } = useLocation();
  const { delegationSlug } = useParams();
  const navigate = useNavigate();
  const catalog = useCatalog().catalog!;
  const region = pathname.includes('/explore/ben-arous');
  const delegation = delegationSlug ? delegationBySlug(catalog, delegationSlug) : null;
  const [locked, setLocked] = useState<string | null>(null);
  const [pinId, setPinId] = useState<string | null>(null);
  const [govs, setGovs] = useState<GovFC | null>(null);
  useEffect(() => { loadGovernorates().then(setGovs).catch(() => setGovs(null)); }, []);
  useEffect(() => setPinId(null), [delegationSlug]);

  const pins = useMemo(() => catalog.locations
    .filter((l) => hasVerifiedCoords(l) && (!delegation || l.delegationId === delegation.id))
    .map((l) => ({ id: l.id, lat: l.lat!, lng: l.lng!, label: tr(l.name, lang) })), [catalog, delegation, lang]);
  const pinned = pinId ? catalog.locations.find((l) => l.id === pinId) ?? null : null;

  if (delegationSlug && !delegation) return <NotFoundPage />;

  const onGovernorate = (id: string, name: string) => {
    if (AVAILABLE_GOVERNORATES.has(id)) navigate(to('explore/ben-arous'));
    else setLocked(name);
  };
  const onDelegation = (id: string) => {
    const d = delegationById(catalog, id);
    if (d) navigate(d.slug === delegationSlug ? to('explore/ben-arous') : to(`explore/ben-arous/${d.slug}`));
  };

  const title = delegation ? tr(delegation.name, lang) : region ? t('map.benArous') : t('map.tunisia');

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <Seo title={title} description={region ? t('map.regionLabel') : t('map.tunisiaLabel')} />
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link to={to('explore')} className="hover:text-white">{t('map.tunisia')}</Link>
        {region && <><span aria-hidden>/</span><Link to={to('explore/ben-arous')} className="hover:text-white">{t('map.benArous')}</Link></>}
        {delegation && <><span aria-hidden>/</span><span className="text-white" aria-current="page">{tr(delegation.name, lang)}</span></>}
      </nav>
      <h1 className="mb-6 text-3xl font-extrabold sm:text-5xl" dir="auto">{title}</h1>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative">
          <Suspense fallback={<div className="h-[60vh] min-h-[380px] rounded-3xl border border-line"><Loading /></div>}>
            <MapView mode={region ? 'region' : 'country'} lang={lang} selectedDelegationId={delegation?.id ?? null}
              pins={region ? pins : []} selectedPinId={pinId} onGovernorate={onGovernorate} onDelegation={onDelegation} onPin={setPinId}
              className="h-[60vh] min-h-[380px] lg:h-[72vh]" />
          </Suspense>
          {pinned && (
            <PinPreview locationId={pinned.id} onClose={() => setPinId(null)} />
          )}
          {region && <p className="mt-3 text-xs text-muted">{t('map.pinsHint')}</p>}
        </div>

        <aside aria-label={region ? t('map.delegations') : t('map.governorates')} className="card max-h-none p-5 lg:max-h-[72vh] lg:overflow-y-auto">
          {!region ? (
            <>
              <Link to={to('explore/ben-arous')} className="btn btn-primary mb-5 w-full justify-center">{t('map.enter')} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Link>
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted">{t('map.governorates')} · {t('map.listAlternative')}</h2>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-1">
                {(govs?.features ?? []).map((f) => f.properties).sort((a, b) => a.ins_code.localeCompare(b.ins_code)).map((p) => {
                  const avail = AVAILABLE_GOVERNORATES.has(p.id), name = geoName(p, lang);
                  return (
                    <li key={p.id}>
                      <button type="button" onClick={() => onGovernorate(p.id, name)}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-start text-sm transition ${avail ? 'bg-primary/15 font-semibold text-white hover:bg-primary/25' : 'text-muted hover:bg-white/5'}`}>
                        <span>{name}</span>
                        <span className="flex items-center gap-1 text-xs">{avail ? <Unlock className="h-3.5 w-3.5 text-primary" aria-hidden /> : <Lock className="h-3.5 w-3.5" aria-hidden />}{avail ? t('map.available') : t('map.comingSoon')}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : delegation ? (
            <DelegationPanel delegationId={delegation.id} />
          ) : (
            <>
              <Link to={to('explore')} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /> {t('map.backToTunisia')}</Link>
              <p className="mb-4 text-sm text-muted">{t('map.selectDelegation')}</p>
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted">{t('map.delegations')}</h2>
              <ul className="flex flex-col gap-1">
                {catalog.delegations.map((d) => {
                  const n = locationsInDelegation(catalog, d.id).length;
                  return (
                    <li key={d.id}>
                      <Link to={to(`explore/ben-arous/${d.slug}`)} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-white/5">
                        <span className="font-semibold">{tr(d.name, lang)}</span>
                        <span className="text-xs text-muted">{n ? t('home.discoveries', { count: n }) : '—'}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </aside>
      </div>

      <Dialog open={!!locked} onClose={() => setLocked(null)} title={t('map.comingSoonTitle', { name: locked ?? '' })}>
        <p className="text-muted">{t('map.comingSoonBody', { name: locked ?? '' })}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={to('explore/ben-arous')} className="btn btn-primary" onClick={() => setLocked(null)}>{t('map.enter')}</Link>
          <button type="button" className="btn btn-ghost" onClick={() => setLocked(null)}>{t('common.close')}</button>
        </div>
      </Dialog>
    </div>
  );
}

function DelegationPanel({ delegationId }: { delegationId: string }) {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const c = useCatalog().catalog!;
  const d = delegationById(c, delegationId)!;
  const locs = locationsInDelegation(c, d.id);
  const posts = delegationOnlyPosts(c, d.id);
  return (
    <div>
      <Link to={to('explore/ben-arous')} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /> {t('map.backToRegion')}</Link>
      <h2 className="text-2xl font-extrabold" dir="auto">{tr(d.name, lang)}</h2>
      <p className="mb-5 text-sm text-muted" lang="ar" dir="rtl">{lang !== 'ar' ? d.sourceName.ar : d.sourceName.fr}</p>
      {locs.length === 0 && posts.length === 0 ? <Empty>{t('map.emptyDelegation')}</Empty> : (
        <ul className="flex flex-col gap-2">
          {locs.map((l) => (
            <li key={l.id}>
              <Link to={to(`places/${l.slug}`)} className="flex items-start gap-3 rounded-xl border border-line p-3 hover:border-primary">
                {hasVerifiedCoords(l) ? <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> : <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />}
                <span>
                  <span className="block font-semibold" dir="auto">{tr(l.name, lang)}</span>
                  {!hasVerifiedCoords(l) && <span className="block text-xs text-muted">{t('map.unpinned')}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {posts.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">{t('place.instagram')}</h3>
          {posts.map((p) => <InstagramEmbed key={p.id} post={p} subtitle={tr(d.name, lang)} />)}
        </div>
      )}
    </div>
  );
}

function PinPreview({ locationId, onClose }: { locationId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { lang, to } = useLang();
  const c = useCatalog().catalog!;
  const l = c.locations.find((x) => x.id === locationId)!;
  const d = delegationById(c, l.delegationId);
  const cat = categoryById(c, l.categoryId);
  const cover = mediaById(c, l.coverMediaId);
  const post = c.socialPosts.find((p) => p.locationId === l.id);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <section aria-label={tr(l.name, lang)} aria-live="polite" className="rise absolute inset-x-3 bottom-3 z-[500] card overflow-hidden shadow-2xl sm:inset-x-auto sm:end-3 sm:w-80">
      {cover?.url && <img src={cover.url} alt={tr(cover.alt, lang)} className="aspect-[16/9] w-full object-cover" />}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{d ? tr(d.name, lang) : ''}{cat ? ` · ${tr(cat.name, lang)}` : ''}</p>
            <h3 className="text-lg font-bold" dir="auto">{tr(l.name, lang)}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line">×</button>
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-muted" dir="auto">{tr(l.summary, lang) || t('common.comingSoon')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to={to(`places/${l.slug}`)} className="btn btn-primary !py-2 text-sm">{t('common.openDetails')}</Link>
          {post && <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-sm underline decoration-primary underline-offset-4">{t('common.viewOnInstagram')}</a>}
        </div>
      </div>
    </section>
  );
}

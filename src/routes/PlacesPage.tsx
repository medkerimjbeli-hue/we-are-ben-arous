import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { useCatalog } from '../data/CatalogProvider';
import { searchLocations } from '../data/selectors';
import { useLang } from '../hooks/useLang';
import { tr } from '../lib/localize';
import { Seo } from '../components/Seo';
import { Empty } from '../components/States';
import { LocationCard } from '../features/locations/LocationCard';

export default function PlacesPage() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const c = useCatalog().catalog!;
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const categoryId = params.get('category');
  const delegationId = params.get('delegation');
  const kind = (params.get('type') as 'place' | 'story' | null) ?? null;
  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  const results = useMemo(() => searchLocations(c, { q, categoryId, delegationId, kind }, lang), [c, q, categoryId, delegationId, kind, lang]);
  const filtered = q || categoryId || delegationId || kind;
  const usedCategories = c.categories.filter((cat) => c.locations.some((l) => l.categoryId === cat.id));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <Seo title={t('search.title')} description={t('search.lead')} />
      <h1 className="text-4xl font-extrabold sm:text-5xl">{t('search.title')}</h1>
      <p className="mt-3 text-lg text-muted">{t('search.lead')}</p>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="card mt-8 grid gap-4 p-4 sm:p-5 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor="q" className="label">{t('search.label')}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="q" type="search" dir="auto" value={q} onChange={(e) => set('q', e.target.value)} placeholder={t('search.placeholder')} className="field ps-9" />
          </div>
        </div>
        <div>
          <label htmlFor="del" className="label">{t('search.delegation')}</label>
          <select id="del" className="field" value={delegationId ?? ''} onChange={(e) => set('delegation', e.target.value || null)}>
            <option value="">{t('common.all')}</option>
            {c.delegations.map((d) => <option key={d.id} value={d.id}>{tr(d.name, lang)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cat" className="label">{t('search.category')}</label>
          <select id="cat" className="field" value={categoryId ?? ''} onChange={(e) => set('category', e.target.value || null)}>
            <option value="">{t('common.all')}</option>
            {usedCategories.map((cat) => <option key={cat.id} value={cat.id}>{tr(cat.name, lang)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="label">{t('search.type')}</label>
          <select id="type" className="field" value={kind ?? ''} onChange={(e) => set('type', e.target.value || null)}>
            <option value="">{t('common.all')}</option>
            <option value="place">{t('place.place_kind')}</option>
            <option value="story">{t('place.story_kind')}</option>
          </select>
        </div>
        <button type="button" disabled={!filtered} onClick={() => setParams({}, { replace: true })} className="btn btn-ghost justify-center disabled:opacity-40">
          <X className="h-4 w-4" aria-hidden /> {t('common.reset')}
        </button>
      </form>

      <p className="mb-5 mt-6 text-sm text-muted" role="status" aria-live="polite">{t('search.results', { count: results.length })}</p>
      {results.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{results.map((l) => <LocationCard key={l.id} location={l} catalog={c} />)}</div>
      ) : (
        <Empty icon={<Search className="h-6 w-6" />}>
          <p>{t('search.noResults')}</p>
          {filtered && <button type="button" onClick={() => setParams({}, { replace: true })} className="btn btn-primary mt-4">{t('common.reset')}</button>}
        </Empty>
      )}
    </div>
  );
}

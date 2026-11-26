import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import { useCatalog } from '../data/CatalogProvider';
import { Seo } from '../components/Seo';
import { Empty } from '../components/States';
import { LocationCard } from '../features/locations/LocationCard';

export default function StoriesPage() {
  const { t } = useTranslation();
  const c = useCatalog().catalog!;
  const stories = c.locations.filter((l) => l.kind === 'story').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <Seo title={t('stories.title')} description={t('stories.lead')} />
      <h1 className="text-4xl font-extrabold sm:text-5xl">{t('stories.title')}</h1>
      <p className="mb-10 mt-3 text-lg text-muted">{t('stories.lead')}</p>
      {stories.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{stories.map((l) => <LocationCard key={l.id} location={l} catalog={c} />)}</div>
      ) : <Empty icon={<BookOpen className="h-6 w-6" />}>{t('stories.empty')}</Empty>}
    </div>
  );
}

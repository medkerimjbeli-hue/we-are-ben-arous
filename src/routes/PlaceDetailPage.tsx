import { useParams } from 'react-router-dom';
import { useCatalog } from '../data/CatalogProvider';
import { useLang } from '../hooks/useLang';
import { tr } from '../lib/localize';
import { Seo } from '../components/Seo';
import { LocationDetail } from '../features/locations/LocationDetail';
import { mediaById } from '../data/selectors';
import NotFoundPage from './NotFoundPage';

export default function PlaceDetailPage() {
  const { slug } = useParams();
  const { lang } = useLang();
  const c = useCatalog().catalog!;
  const l = c.locations.find((x) => x.slug === slug);
  if (!l) return <NotFoundPage />;
  return (
    <>
      <Seo
        title={tr(l.seoTitle, lang) || tr(l.name, lang)}
        description={tr(l.seoDescription, lang) || tr(l.summary, lang) || undefined}
        image={mediaById(c, l.coverMediaId)?.url}
        type="article"
      />
      <LocationDetail location={l} catalog={c} />
    </>
  );
}

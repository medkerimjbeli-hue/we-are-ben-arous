import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../hooks/useLang';
import { Seo } from '../components/Seo';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const { to } = useLang();
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <Seo title={t('meta.notFound')} />
      <p className="font-display text-8xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-3xl font-extrabold">{t('notFound.title')}</h1>
      <p className="mt-3 text-muted">{t('notFound.body')}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to={to()} className="btn btn-primary">{t('notFound.home')}</Link>
        <Link to={to('explore')} className="btn btn-ghost">{t('nav.explore')}</Link>
      </div>
    </div>
  );
}

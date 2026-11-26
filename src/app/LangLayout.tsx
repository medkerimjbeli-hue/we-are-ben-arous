import { Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { applyLang, isLang, preferredLang } from '../features/i18n/i18n';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Loading, ErrorState } from '../components/States';
import { useCatalog } from '../data/CatalogProvider';

/** Validates the :lang segment, applies language + direction, and renders the public chrome. */
export function LangLayout() {
  const { lang } = useParams();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { loading, error, reload } = useCatalog();
  const valid = isLang(lang);
  useEffect(() => { if (valid) applyLang(lang); }, [lang, valid]);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  if (!valid) return <Navigate to={`/${preferredLang()}${pathname}`} replace />;
  return (
    <>
      <a href="#main" className="skip-link btn btn-primary">{t('nav.skip')}</a>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {error ? <ErrorState onRetry={reload} /> : loading ? <Loading /> : (
          <Suspense fallback={<Loading />}><Outlet /></Suspense>
        )}
      </main>
      <Footer />
    </>
  );
}

export function RootRedirect() {
  const { pathname, search, hash } = useLocation();
  const rest = pathname === '/' ? '' : pathname;
  return <Navigate to={`/${preferredLang()}${rest}${search}${hash}`} replace />;
}

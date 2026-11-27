import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CatalogProvider } from '../data/CatalogProvider';
import { LangLayout, RootRedirect } from './LangLayout';
import { Loading } from '../components/States';
import { ErrorBoundary } from '../components/ErrorBoundary';
import HomePage from '../routes/HomePage';

const ExplorePage = lazy(() => import('../routes/ExplorePage'));
const PlacesPage = lazy(() => import('../routes/PlacesPage'));
const PlaceDetailPage = lazy(() => import('../routes/PlaceDetailPage'));
const StoriesPage = lazy(() => import('../routes/StoriesPage'));
const AboutPage = lazy(() => import('../routes/AboutPage'));
const NotFoundPage = lazy(() => import('../routes/NotFoundPage'));
const AdminApp = lazy(() => import('../features/admin/AdminApp'));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin/*" element={<ErrorBoundary><Suspense fallback={<Loading />}><AdminApp /></Suspense></ErrorBoundary>} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="/:lang" element={<LangLayout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="explore/ben-arous" element={<ExplorePage />} />
        <Route path="explore/ben-arous/:delegationSlug" element={<ExplorePage />} />
        <Route path="places" element={<PlacesPage />} />
        <Route path="places/:slug" element={<PlaceDetailPage />} />
        <Route path="stories" element={<StoriesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <CatalogProvider>
        <AppRoutes />
      </CatalogProvider>
    </BrowserRouter>
  );
}

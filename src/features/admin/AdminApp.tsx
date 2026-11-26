import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { NavLink, Navigate, Route, Routes, Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { FolderTree, Image, LayoutDashboard, LogOut, MapPinned, Map as MapIcon, ExternalLink } from 'lucide-react';
import { Instagram } from '../../components/InstagramIcon';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import i18n from '../i18n/i18n';
import type { Catalog } from '../../types';
import { loadAdminCatalog } from './api';
import { Loading, ErrorState } from '../../components/States';
import { asset } from '../../hooks/useLang';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LocationsPage from './pages/LocationsPage';
import LocationEditPage from './pages/LocationEditPage';
import PostsPage from './pages/PostsPage';
import PostEditPage from './pages/PostEditPage';
import CategoriesPage from './pages/CategoriesPage';
import MediaPage from './pages/MediaPage';
import DelegationsPage from './pages/DelegationsPage';

interface AdminCtx { catalog: Catalog; reload: () => Promise<void>; session: Session }
const Ctx = createContext<AdminCtx | null>(null);
export function useAdmin() { const v = useContext(Ctx); if (!v) throw new Error('useAdmin outside AdminApp'); return v; }

type AuthState = { status: 'loading' } | { status: 'signed_out' } | { status: 'not_admin'; session: Session } | { status: 'admin'; session: Session };

export default function AdminApp() {
  // The dashboard UI is English; don't overwrite the visitor's saved public-site language.
  useEffect(() => { void i18n.changeLanguage('en'); document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr'; document.title = 'Admin · We Are Ben Arous'; }, []);
  if (!isSupabaseConfigured || !supabase) return <NotConfigured />;
  return <AuthGate />;
}

function AuthGate() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });
  useEffect(() => {
    const s = supabase!;
    const resolve = async (session: Session | null) => {
      if (!session) return setAuth({ status: 'signed_out' });
      // Authorization is enforced by RLS; this check only decides which screen to show.
      const { data, error } = await s.rpc('is_admin');
      setAuth(error || !data ? { status: 'not_admin', session } : { status: 'admin', session });
    };
    s.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = s.auth.onAuthStateChange((_e, session) => { void resolve(session); });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (auth.status === 'loading') return <Loading />;
  if (auth.status === 'signed_out') return <Routes><Route path="*" element={<LoginPage />} /></Routes>;
  if (auth.status === 'not_admin') return (
    <Shell centered>
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="mt-2 text-muted">You are signed in as <strong>{auth.session.user.email}</strong>, but this account is not an administrator.</p>
      <button className="btn btn-ghost mt-6" onClick={() => supabase!.auth.signOut()}>Sign out</button>
    </Shell>
  );
  return <AdminData session={auth.session} />;
}

function AdminData({ session }: { session: Session }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try { setError(null); setCatalog(await loadAdminCatalog()); } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!catalog) return <Loading />;
  return (
    <Ctx.Provider value={{ catalog, reload, session }}>
      <AdminLayout>
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="locations/:id" element={<LocationEditPage />} />
          <Route path="posts" element={<PostsPage />} />
          <Route path="posts/:id" element={<PostEditPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="delegations" element={<DelegationsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </Ctx.Provider>
  );
}

function AdminLayout({ children }: { children: ReactNode }) {
  const { session } = useAdmin();
  const items = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/locations', label: 'Locations & stories', icon: MapPinned },
    { to: '/admin/posts', label: 'Instagram posts', icon: Instagram },
    { to: '/admin/media', label: 'Media', icon: Image },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    { to: '/admin/delegations', label: 'Delegations', icon: MapIcon },
  ];
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-ink-2 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-e">
        <div className="flex items-center gap-2 p-4">
          <img src={asset('brand/logo-256.webp')} alt="" className="h-9 w-9" />
          <span className="font-display text-sm font-extrabold">WAB Admin</span>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
          {items.map(({ to, label, icon: I, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-primary text-white' : 'text-muted hover:bg-white/5 hover:text-white'}`}>
              <I className="h-4 w-4" aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-line p-4 text-xs text-muted md:absolute md:bottom-0 md:block md:w-full">
          <p className="truncate">{session.user.email}</p>
          <div className="mt-2 flex gap-3">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-white"><ExternalLink className="h-3.5 w-3.5" /> Site</Link>
            <button onClick={() => supabase!.auth.signOut()} className="inline-flex items-center gap-1 hover:text-white"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">
        {children}
        <button onClick={() => supabase!.auth.signOut()} className="btn btn-ghost mt-10 md:hidden"><LogOut className="h-4 w-4" /> Sign out</button>
      </main>
    </div>
  );
}

export function Shell({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className={`card w-full max-w-md p-8 ${centered ? 'text-center' : ''}`}>
        <img src={asset('brand/logo-256.webp')} alt="We Are Ben Arous" className={`mb-6 h-16 w-16 ${centered ? 'mx-auto' : ''}`} />
        {children}
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <Shell>
      <h1 className="text-2xl font-bold">Admin backend not configured</h1>
      <p className="mt-3 text-sm text-muted">
        The content-management dashboard needs a Supabase project. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>,
        apply the migrations in <code>supabase/migrations</code>, and create the first administrator as described in <code>docs/BACKEND_SETUP.md</code>.
      </p>
      <p className="mt-3 text-sm text-muted">The public site is currently showing the bundled owner-supplied content.</p>
      <Link to="/" className="btn btn-ghost mt-6">Back to site</Link>
    </Shell>
  );
}

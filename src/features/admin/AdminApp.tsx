import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { NavLink, Navigate, Route, Routes, Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { ExternalLink, FolderTree, History, Image, LayoutDashboard, LogOut, Map as MapIcon, MapPinned } from 'lucide-react';
import { Instagram } from '../../components/InstagramIcon';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import i18n, { ADMIN_LANG_STORAGE_KEY, dirFor, isLang } from '../i18n/i18n';
import { LANGS, type Catalog, type Lang } from '../../types';
import { loadAdminCatalog } from './api';
import { Loading, ErrorState } from '../../components/States';
import { asset } from '../../hooks/useLang';
import { useA, useErrorText } from './ui';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LocationsPage from './pages/LocationsPage';
import LocationEditPage from './pages/LocationEditPage';
import PostsPage from './pages/PostsPage';
import PostEditPage from './pages/PostEditPage';
import CategoriesPage from './pages/CategoriesPage';
import MediaPage from './pages/MediaPage';
import DelegationsPage from './pages/DelegationsPage';
import HistoryPage from './pages/HistoryPage';

interface AdminCtx { catalog: Catalog; reload: () => Promise<void>; session: Session }
const Ctx = createContext<AdminCtx | null>(null);
export function useAdmin() { const v = useContext(Ctx); if (!v) throw new Error('useAdmin outside AdminApp'); return v; }

type AuthState = { status: 'loading' } | { status: 'signed_out' } | { status: 'recovery'; session: Session } | { status: 'not_admin'; session: Session } | { status: 'admin'; session: Session };

function savedAdminLang(): Lang {
  try { const v = localStorage.getItem(ADMIN_LANG_STORAGE_KEY); if (isLang(v)) return v; } catch { /* ignore */ }
  return 'en';
}

/** Applies the dashboard language without touching the visitor's public-site preference. */
function useAdminLang() {
  const [lang, setLang] = useState<Lang>(savedAdminLang);
  useEffect(() => {
    void i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
    document.title = `${i18n.t('admin.nav.dashboard')} · We Are Ben Arous`;
    try { localStorage.setItem(ADMIN_LANG_STORAGE_KEY, lang); } catch { /* ignore */ }
  }, [lang]);
  return [lang, setLang] as const;
}

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'en', setLang: () => {} });

export default function AdminApp() {
  const [lang, setLang] = useAdminLang();
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      {!isSupabaseConfigured || !supabase ? <NotConfigured /> : <AuthGate />}
    </LangCtx.Provider>
  );
}

export function AdminLangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang } = useContext(LangCtx);
  const { a } = useA();
  return (
    <label className={`flex items-center gap-2 text-xs text-muted ${className}`}>
      <span className="sr-only">{a('nav.language')}</span>
      <select className="field !min-h-9 !py-1 text-xs" value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label={a('nav.language')}>
        {LANGS.map((l) => <option key={l} value={l} lang={l}>{a(`langs.${l}`)}</option>)}
      </select>
    </label>
  );
}

function AuthGate() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });
  const { a } = useA();
  useEffect(() => {
    const s = supabase!;
    const resolve = async (session: Session | null, recovery = false) => {
      if (!session) return setAuth({ status: 'signed_out' });
      if (recovery) return setAuth({ status: 'recovery', session });
      // Authorization is enforced by RLS in the database; this check only decides which screen to show.
      const { data, error } = await s.rpc('is_admin');
      setAuth(error || !data ? { status: 'not_admin', session } : { status: 'admin', session });
    };
    s.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = s.auth.onAuthStateChange((event, session) => { void resolve(session, event === 'PASSWORD_RECOVERY'); });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (auth.status === 'loading') return <Loading />;
  if (auth.status === 'signed_out') return <Routes><Route path="*" element={<LoginPage />} /></Routes>;
  if (auth.status === 'recovery') return <SetPassword onDone={() => setAuth({ status: 'loading' })} />;
  if (auth.status === 'not_admin') return (
    <Shell centered>
      <h1 className="text-2xl font-bold">{a('auth.denied')}</h1>
      <p className="mt-2 text-muted">{a('auth.deniedBody', { email: auth.session.user.email })}</p>
      <button className="btn btn-ghost mt-6" onClick={() => supabase!.auth.signOut()}>{a('nav.signOut')}</button>
    </Shell>
  );
  return <AdminData session={auth.session} />;
}

function SetPassword({ onDone }: { onDone: () => void }) {
  const { a } = useA();
  const errText = useErrorText();
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) { setMsg(a('auth.passwordTooShort')); return; }
    const { error } = await supabase!.auth.updateUser({ password: pw });
    if (error) setMsg(errText(error)); else { setMsg(a('auth.passwordSet')); setTimeout(onDone, 800); }
  };
  return (
    <Shell>
      <h1 className="text-2xl font-bold">{a('auth.newPassword')}</h1>
      <p className="mt-1 text-sm text-muted">{a('auth.newPasswordLead')}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label className="label" htmlFor="npw">{a('auth.password')}</label><input id="npw" type="password" autoComplete="new-password" minLength={10} required className="field" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
        <button className="btn btn-primary w-full justify-center">{a('auth.setPassword')}</button>
      </form>
    </Shell>
  );
}

function AdminData({ session }: { session: Session }) {
  const { a } = useA();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try { setError(null); setCatalog(await loadAdminCatalog()); } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  if (error) return <ErrorState message={a('auth.loadError', { message: error })} onRetry={reload} />;
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
          <Route path="history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </Ctx.Provider>
  );
}

function AdminLayout({ children }: { children: ReactNode }) {
  const { session } = useAdmin();
  const { a } = useA();
  const items = [
    { to: '/admin', label: a('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/locations', label: a('nav.locations'), icon: MapPinned },
    { to: '/admin/posts', label: a('nav.posts'), icon: Instagram },
    { to: '/admin/media', label: a('nav.media'), icon: Image },
    { to: '/admin/categories', label: a('nav.categories'), icon: FolderTree },
    { to: '/admin/delegations', label: a('nav.delegations'), icon: MapIcon },
    { to: '/admin/history', label: a('nav.history'), icon: History },
  ];
  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="border-b border-line bg-ink-2 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-b-0 md:border-e">
        <div className="flex items-center gap-2 p-4">
          <img src={asset('brand/logo-256.webp')} alt="" className="h-9 w-9" />
          <span className="font-display text-sm font-extrabold" dir="ltr">WAB Admin</span>
          <AdminLangSwitch className="ms-auto md:hidden" />
        </div>
        <nav aria-label={a('nav.menu')} className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
          {items.map(({ to, label, icon: I, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-[var(--color-primary-button)] text-white' : 'text-muted hover:bg-white/5 hover:text-white'}`}>
              <I className="h-4 w-4" aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-line p-4 text-xs text-muted md:mt-auto md:block">
          <AdminLangSwitch className="mb-3" />
          <p className="truncate" dir="ltr">{session.user.email}</p>
          <div className="mt-2 flex gap-3">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-white"><ExternalLink className="h-3.5 w-3.5" aria-hidden /> {a('nav.site')}</Link>
            <button onClick={() => supabase!.auth.signOut()} className="inline-flex items-center gap-1 hover:text-white"><LogOut className="h-3.5 w-3.5" aria-hidden /> {a('nav.signOut')}</button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">
        {children}
        <button onClick={() => supabase!.auth.signOut()} className="btn btn-ghost mt-10 md:hidden"><LogOut className="h-4 w-4" aria-hidden /> {a('nav.signOut')}</button>
      </main>
    </div>
  );
}

export function Shell({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className={`card w-full max-w-md p-8 ${centered ? 'text-center' : ''}`}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <img src={asset('brand/logo-256.webp')} alt="We Are Ben Arous" className="h-16 w-16" />
          <AdminLangSwitch />
        </div>
        {children}
      </div>
    </div>
  );
}

function NotConfigured() {
  const { a } = useA();
  return (
    <Shell>
      <h1 className="text-2xl font-bold">{a('auth.notConfiguredTitle')}</h1>
      <p className="mt-3 text-sm text-muted">{a('auth.notConfiguredBody')}</p>
      <p className="mt-3 text-sm text-muted">{a('auth.notConfiguredSeed')}</p>
      <Link to="/" className="btn btn-ghost mt-6">{a('auth.backToSite')}</Link>
    </Shell>
  );
}

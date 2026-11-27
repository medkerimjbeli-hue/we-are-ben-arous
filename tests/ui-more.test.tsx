import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../src/features/i18n/i18n';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../src/features/i18n/i18n';
import { AppRoutes } from '../src/app/App';
import { CatalogProvider } from '../src/data/CatalogProvider';
import { seedCatalog, type PublicCatalog } from '../src/data/catalog';
import { InstagramEmbed } from '../src/features/instagram/InstagramEmbed';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

beforeEach(async () => { await i18n.changeLanguage('en'); });
const base = { ...seedCatalog(), source: 'seed' as const };
function renderAt(path: string, catalog: PublicCatalog = base) {
  return render(<MemoryRouter initialEntries={[path]}><CatalogProvider initial={catalog}><AppRoutes /></CatalogProvider></MemoryRouter>);
}

describe('public routes in every language', () => {
  const routes = ['', '/explore', '/explore/ben-arous', '/explore/ben-arous/mornag', '/places', '/places/saraya', '/stories', '/about'];
  for (const lang of ['en', 'fr', 'ar'] as const) {
    it(`renders all main routes in ${lang}`, async () => {
      for (const r of routes) {
        const { unmount } = renderAt(`/${lang}${r}`);
        expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(document.documentElement.lang).toBe(lang);
        expect(document.documentElement.dir).toBe(lang === 'ar' ? 'rtl' : 'ltr');
        expect(screen.queryByText(/^(meta|nav|home|map|place|search|common)\.[a-zA-Z]+/)).toBeNull(); // no raw i18n keys
        unmount();
      }
    });
  }
});

describe('Ben Arous exploration (list alternative to the map)', () => {
  it('lists the 12 delegations and opens one with its places', async () => {
    renderAt('/en/explore/ben-arous');
    const aside = await screen.findByRole('complementary', { name: 'Delegations' });
    const links = within(aside).getAllByRole('link').filter((a) => a.getAttribute('href')?.includes('/explore/ben-arous/'));
    expect(links).toHaveLength(12);
    await userEvent.click(within(aside).getByRole('link', { name: /Hammam Lif/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Hammam Lif' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Louzina/ })).toBeInTheDocument();
    expect(screen.getAllByText('Shown without a map pin until its position is verified.').length).toBe(2);
  });
  it('shows an empty state for a delegation without discoveries', async () => {
    renderAt('/fr/explore/ben-arous/megrine');
    expect(await screen.findByText('Aucune découverte publiée dans cette délégation pour le moment.')).toBeInTheDocument();
  });
  it('explains that other governorates are coming soon', async () => {
    renderAt('/en/explore');
    await userEvent.click(await screen.findByRole('button', { name: /Sfax/ }));
    expect(await screen.findByRole('dialog', { name: 'Sfax is coming soon' })).toBeInTheDocument();
  });
  it('returns 404 for an unknown delegation', async () => {
    renderAt('/en/explore/ben-arous/atlantis');
    expect(await screen.findByText('This page doesn’t exist')).toBeInTheDocument();
  });
});

describe('stories linked to places', () => {
  const place = base.locations.find((l) => l.slug === 'old-factory')!;
  const story = { ...place, id: 'story-1', kind: 'story' as const, slug: 'memories', name: { en: 'Memories of the factory' }, placeId: place.id, summary: { en: 'A test story.' } };
  const catalog = { ...base, locations: [...base.locations, story] };
  it('shows related stories on the place, and the place on the story', async () => {
    const { unmount } = renderAt('/en/places/old-factory', catalog);
    expect(await screen.findByRole('heading', { name: 'Related stories' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Memories of the factory' })).toBeInTheDocument();
    unmount();
    renderAt('/en/places/memories', catalog);
    expect(await screen.findByText('A story about')).toBeInTheDocument();
    expect(within(screen.getByText('A story about').closest('p')!).getByRole('link', { name: 'Old Factory' })).toHaveAttribute('href', '/en/places/old-factory');
  });
  it('lists stories on the stories page', async () => {
    renderAt('/ar/stories', catalog);
    expect(await screen.findByRole('link', { name: 'Memories of the factory' })).toBeInTheDocument();
  });
  it('uses SEO overrides for the document title', async () => {
    renderAt('/fr/places/old-factory', { ...catalog, locations: catalog.locations.map((l) => (l.id === place.id ? { ...l, seoTitle: { fr: 'Ancienne usine de Mornag' } } : l)) });
    await waitFor(() => expect(document.title).toBe('Ancienne usine de Mornag · We Are Ben Arous'));
  });
});

describe('Instagram fallback', () => {
  afterEach(() => { vi.useRealTimers(); delete window.instgrm; });
  const post = base.socialPosts[1]; // the regular /p/ post
  it('keeps the original link and falls back when the embed never renders', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.instgrm = { Embeds: { process: () => {} } }; // embed script "loads" but produces no iframe
    render(<MemoryRouter><InstagramEmbed post={post} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /View on Instagram/ })).toHaveAttribute('href', post.url);
    expect(screen.getByText('Post')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Load post' }));
    await act(async () => { vi.advanceTimersByTime(10_500); });
    expect(await screen.findByText(/can’t be displayed here/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View on Instagram/ })).toHaveAttribute('href', post.url);
  });
});

describe('error boundary', () => {
  it('contains a crashing section', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Boom = () => { throw new Error('boom'); };
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Reload the page');
    spy.mockRestore();
  });
});

describe('admin interface languages', () => {
  it('renders the dashboard setup screen in Arabic RTL without changing the public preference', async () => {
    localStorage.setItem('wab.lang', 'fr');
    localStorage.setItem('wab.adminLang', 'ar');
    renderAt('/admin');
    expect(await screen.findByText('لم يتم إعداد الخادم الخلفي للإدارة')).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(localStorage.getItem('wab.lang')).toBe('fr');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'لغة لوحة التحكم' }), 'fr');
    expect(await screen.findByText('Back-office non configuré')).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('ltr');
    localStorage.clear();
  });
});

import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../src/features/i18n/i18n';
import { AppRoutes } from '../src/app/App';
import { CatalogProvider } from '../src/data/CatalogProvider';
import { seedCatalog } from '../src/data/catalog';
import { LocationDetail } from '../src/features/locations/LocationDetail';

const catalog = { ...seedCatalog(), source: 'seed' as const };
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CatalogProvider initial={catalog}><AppRoutes /></CatalogProvider>
    </MemoryRouter>,
  );
}

describe('language and direction', () => {
  it('renders Arabic right-to-left', async () => {
    renderAt('/ar/about');
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(document.documentElement.lang).toBe('ar');
    expect(await screen.findByRole('heading', { level: 1, name: 'عن وي آر بن عروس' })).toBeInTheDocument();
  });
  it('switches language from the header, keeping the page', async () => {
    renderAt('/en/about');
    await screen.findByRole('heading', { level: 1, name: 'About We Are Ben Arous' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Français' })[0]);
    expect(await screen.findByRole('heading', { level: 1, name: 'À propos de We Are Ben Arous' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('ltr');
  });
  it('redirects an unprefixed path to a language', async () => {
    renderAt('/about');
    await waitFor(() => expect(['en', 'fr', 'ar']).toContain(document.documentElement.lang));
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('discoveries', () => {
  it('filters and shows an empty state with reset', async () => {
    renderAt('/en/places');
    expect(await screen.findByText('6 results')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), 'zzzz');
    expect(await screen.findByText('No discoveries match your search.')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: /Reset/ })[1]);
    expect(await screen.findByText('6 results')).toBeInTheDocument();
  });
  it('shows a 404 for unknown places', async () => {
    renderAt('/en/places/does-not-exist');
    expect(await screen.findByText('This page doesn’t exist')).toBeInTheDocument();
  });
  it('detail page hides missing optional content instead of inventing it', async () => {
    const loc = catalog.locations.find((l) => l.name.en === 'Old Factory')!;
    render(<MemoryRouter initialEntries={['/en']}><LocationDetail location={loc} catalog={catalog} preview /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Old Factory' })).toBeInTheDocument();
    expect(screen.getByText('Information coming soon')).toBeInTheDocument();
    expect(screen.getByText(/exact position of this place hasn’t been verified/)).toBeInTheDocument();
    expect(screen.queryByText('Category')).toBeNull();
    expect(screen.getByRole('link', { name: /View on Instagram/ })).toHaveAttribute('href', 'https://www.instagram.com/reel/Df2uk0RNOHp/?utm_source=ig_web_copy_link&gwpx=MzRlODBiNWFlZA==&avpt=MzRlODBiNWFlZA==');
  });
});

describe('admin boundary', () => {
  it('without a backend, /admin explains configuration and grants no access', async () => {
    renderAt('/admin');
    expect(await screen.findByText('Admin backend not configured')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).toBeNull();
  });
});

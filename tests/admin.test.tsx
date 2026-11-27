// Renders the real admin dashboard against an in-memory fake of the Supabase client.
// (Database authorization itself is tested against real PostgreSQL in tests/db/rls.test.ts.)
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import seed from '../src/data/seed.json';
import type { Catalog } from '../src/types';
import { fromLocation, fromSocialPost } from '../src/data/mappers';

type Row = Record<string, unknown>;
const state = vi.hoisted(() => ({ tables: {} as Record<string, Row[]>, admin: true, writes: [] as { table: string; op: string; row?: Row }[] }));

function resetTables() {
  const s = seed as unknown as Catalog;
  state.tables = {
    delegations: s.delegations.map((d) => ({ id: d.id, ins_code: d.insCode, governorate_id: d.governorateId, slug: d.slug, name: d.name, source_name: d.sourceName, status: d.status })),
    categories: s.categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, sort_order: c.sortOrder })),
    locations: s.locations.map((l) => ({ ...fromLocation(l), created_at: l.createdAt, updated_at: l.updatedAt })),
    social_posts: s.socialPosts.map((p) => ({ ...fromSocialPost(p), created_at: p.createdAt, updated_at: p.updatedAt })),
    media: [],
    content_revisions: [],
  };
  state.writes = [];
}

vi.mock('../src/lib/supabase', () => {
  const builder = (table: string) => {
    let rows = () => state.tables[table] ?? [];
    let op: 'select' | 'insert' | 'update' | 'delete' = 'select';
    let payload: Row | undefined;
    const filters: [string, unknown][] = [];
    let single = false;
    const exec = () => {
      const match = (r: Row) => filters.every(([k, v]) => r[k] === v);
      if (op === 'insert') { const r = { created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...payload }; state.tables[table].push(r); state.writes.push({ table, op, row: r }); return single ? r : [r]; }
      if (op === 'update') { const hit = state.tables[table].filter(match); hit.forEach((r) => Object.assign(r, payload, { updated_at: new Date().toISOString() })); state.writes.push({ table, op, row: payload }); return single ? hit[0] : hit; }
      if (op === 'delete') { state.tables[table] = state.tables[table].filter((r) => !match(r)); state.writes.push({ table, op }); return null; }
      const out = rows().filter(match);
      return single ? out[0] : out;
    };
    const q = {
      select: () => q, order: () => q, limit: () => q,
      eq: (k: string, v: unknown) => { filters.push([k, v]); return q; },
      insert: (r: Row) => { op = 'insert'; payload = r; return q; },
      update: (r: Row) => { op = 'update'; payload = r; return q; },
      delete: () => { op = 'delete'; return q; },
      single: () => { single = true; return q; },
      then: (res: (v: unknown) => void) => res({ data: exec(), error: null }),
    };
    void rows; rows = () => state.tables[table] ?? [];
    return q;
  };
  const session = { user: { id: 'admin-1', email: 'admin@example.test' } };
  return {
    isSupabaseConfigured: true,
    MEDIA_BUCKET: 'media',
    supabase: {
      from: builder,
      rpc: async () => ({ data: state.admin, error: null }),
      storage: { from: () => ({ upload: async () => ({ data: {}, error: null }), remove: async () => ({ data: {}, error: null }) }) },
      auth: {
        getSession: async () => ({ data: { session } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        signOut: async () => ({}),
      },
    },
  };
});

const { AppRoutes } = await import('../src/app/App');
const { CatalogProvider } = await import('../src/data/CatalogProvider');
const { seedCatalog } = await import('../src/data/catalog');

function renderAdmin(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><CatalogProvider initial={{ ...seedCatalog(), source: 'seed' }}><AppRoutes /></CatalogProvider></MemoryRouter>);
}

beforeEach(() => { resetTables(); state.admin = true; localStorage.setItem('wab.adminLang', 'en'); });

describe('admin dashboard (mocked backend)', () => {
  it('shows actionable warnings that open filtered lists', async () => {
    renderAdmin('/admin');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    const todo = screen.getByRole('region', { name: 'What needs attention' });
    const coords = within(todo).getByRole('link', { name: /No verified position/ });
    expect(coords).toHaveTextContent('6');
    expect(coords).toHaveAttribute('href', '/admin/locations?issue=coords');
    expect(within(todo).getByRole('link', { name: /Instagram posts not linked/ })).toHaveTextContent('4');
    await userEvent.click(within(todo).getByRole('link', { name: /No cover photograph/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Places & stories' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(7); // header + 6 places
  });

  it('refuses non-admins (UI) — the database enforces the same rule', async () => {
    state.admin = false;
    renderAdmin('/admin');
    expect(await screen.findByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).toBeNull();
  });

  it('validates and saves a location through the publishing workflow', async () => {
    const loc = (seed as unknown as Catalog).locations[0];
    renderAdmin(`/admin/locations/${loc.id}`);
    expect(await screen.findByRole('heading', { level: 1, name: loc.name.en })).toBeInTheDocument();
    // Marking coordinates verified without a source is an error and is not saved
    await userEvent.type(screen.getByLabelText('Latitude'), '36.7');
    await userEvent.type(screen.getByLabelText('Longitude'), '10.2');
    await userEvent.selectOptions(screen.getByLabelText('Verification status'), 'verified');
    expect(screen.getByText(/Verified positions need/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save for review' }));
    expect(await screen.findByText('Fix the errors before saving.')).toBeInTheDocument();
    expect(state.writes).toHaveLength(0);
    // Add a source → saves with status "needs_review"
    await userEvent.type(screen.getByLabelText('Verification source'), 'On-site GPS');
    await userEvent.click(screen.getByRole('button', { name: 'Save for review' }));
    await waitFor(() => expect(screen.queryAllByRole('alert').map((e) => e.textContent).concat(screen.queryAllByRole('status').map((e) => e.textContent))).toContain('Saved (Needs review).'));
    expect(state.writes[0]).toMatchObject({ table: 'locations', op: 'update', row: { status: 'needs_review', lat: 36.7, lng: 10.2, coordinate_status: 'verified', coordinate_source: 'On-site GPS' } });
  });

  it('edits translations per language and previews before publishing', async () => {
    const loc = (seed as unknown as Catalog).locations[1];
    renderAdmin(`/admin/locations/${loc.id}`);
    await screen.findByRole('heading', { level: 1, name: loc.name.en });
    const summary = screen.getByRole('tablist', { name: 'Short description' });
    await userEvent.click(within(summary).getByRole('tab', { name: /العربية/ }));
    const ar = document.getElementById('summary-ar') as HTMLTextAreaElement;
    expect(ar).toBeVisible();
    expect(ar).toHaveAttribute('dir', 'rtl');
    await userEvent.type(ar, 'وصف تجريبي');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    const dlg = await screen.findByRole('dialog', { name: 'Preview' });
    expect(within(dlg).getByRole('heading', { level: 1, name: loc.name.en })).toBeInTheDocument();
  });

  it('manages featured Instagram posts without duplicate positions', async () => {
    state.tables.social_posts[2].featured = true; state.tables.social_posts[2].featured_rank = 1;
    const p = state.tables.social_posts[0];
    renderAdmin(`/admin/posts/${p.id}`);
    await screen.findByRole('heading', { level: 1, name: String(p.label) });
    expect(screen.getByLabelText('Instagram URL (stored exactly as entered)')).toHaveValue(String(p.url));
    await userEvent.click(screen.getByLabelText('Featured on the homepage'));
    await userEvent.type(screen.getByLabelText('Featured position (1–5)'), '1');
    expect(screen.getByText('Another post already holds featured position 1.')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Featured position (1–5)'));
    await userEvent.type(screen.getByLabelText('Featured position (1–5)'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(state.writes[0]).toMatchObject({ table: 'social_posts', op: 'update', row: { featured: true, featured_rank: 2, url: p.url } }));
  });

  it('works in Arabic with RTL layout', async () => {
    localStorage.setItem('wab.adminLang', 'ar');
    renderAdmin('/admin/locations');
    expect(await screen.findByRole('heading', { level: 1, name: 'الأماكن والحكايات' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('navigation', { name: 'قائمة الإدارة' })).toBeInTheDocument();
  });

  it('rejects oversized or non-image uploads before sending them', async () => {
    renderAdmin('/admin/media');
    await screen.findByRole('heading', { level: 1, name: 'Media' });
    const input = screen.getByLabelText('Image') as HTMLInputElement;
    const svg = new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' });
    await userEvent.upload(input, svg, { applyAccept: false });
    expect(await screen.findByText('Only JPEG, PNG, WebP or AVIF images are accepted.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });
});

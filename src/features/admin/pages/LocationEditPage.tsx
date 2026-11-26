import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Save, Trash2 } from 'lucide-react';
import type { ContentStatus, Location } from '../../../types';
import { STATUSES } from '../../../types';
import { slugify, tr } from '../../../lib/localize';
import { useAdmin } from '../AdminApp';
import { deleteLocation, saveLocation } from '../api';
import { hasErrors, locationIssues } from '../validation';
import { ConfirmButton, IssueList, LocalizedField, PageHeader, STATUS_LABEL, Toast } from '../ui';
import { Dialog } from '../../../components/Dialog';
import { LocationDetail } from '../../locations/LocationDetail';

function blank(delegationId: string): Location {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), kind: 'place', slug: '', delegationId, categoryId: null, name: {}, summary: {}, story: {}, address: {},
    lat: null, lng: null, coordinateStatus: 'unverified', coordinateSource: null, coverMediaId: null, status: 'draft', featured: false,
    sourceNotes: null, createdAt: now, updatedAt: now,
  };
}

export default function LocationEditPage() {
  const { id } = useParams();
  const { catalog: c, reload } = useAdmin();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const existing = c.locations.find((l) => l.id === id);
  const [l, setL] = useState<Location>(() => existing ?? blank(c.delegations[0]?.id ?? ''));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);
  const [preview, setPreview] = useState(false);
  const issues = useMemo(() => locationIssues(l, c), [l, c]);
  const set = <K extends keyof Location>(k: K, v: Location[K]) => setL((x) => ({ ...x, [k]: v }));

  if (!isNew && !existing) return <p className="text-muted">Location not found. <Link to="/admin/locations" className="underline">Back</Link></p>;

  const save = async (status?: ContentStatus) => {
    const next = { ...l, status: status ?? l.status, slug: l.slug || slugify(tr(l.name, 'en')) };
    const errs = locationIssues(next, c);
    if (hasErrors(errs)) { setL(next); setMsg({ text: 'Fix the errors before saving.', kind: 'error' }); return; }
    setBusy(true); setMsg(null);
    try {
      await saveLocation(next, isNew);
      await reload();
      setL(next);
      setMsg({ text: `Saved (${STATUS_LABEL[next.status]}).`, kind: 'ok' });
      if (isNew) navigate(`/admin/locations/${next.id}`, { replace: true });
    } catch (e) { setMsg({ text: (e as Error).message, kind: 'error' }); }
    finally { setBusy(false); }
  };
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  const media = c.media.filter((m) => !m.locationId || m.locationId === l.id);
  const posts = c.socialPosts.filter((p) => p.locationId === l.id);

  return (
    <div className="max-w-4xl">
      <Link to="/admin/locations" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4" /> Locations</Link>
      <PageHeader title={isNew ? 'New location' : tr(l.name, 'en') || '(untitled)'}>
        <button type="button" className="btn btn-ghost" onClick={() => setPreview(true)}><Eye className="h-4 w-4" /> Preview</button>
        <button type="button" disabled={busy} className="btn btn-primary" onClick={() => save()}><Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save'}</button>
      </PageHeader>

      <div className="space-y-4">
        <Toast message={msg?.text ?? null} kind={msg?.kind} />
        <div className="card p-4"><IssueList issues={issues} />{!issues.length && <p className="text-sm text-emerald-300">No issues.</p>}</div>

        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <div><label className="label" htmlFor="kind">Type</label>
            <select id="kind" className="field" value={l.kind} onChange={(e) => set('kind', e.target.value as Location['kind'])}><option value="place">Place</option><option value="story">Community story</option></select></div>
          <div><label className="label" htmlFor="status">Status</label>
            <select id="status" className="field" value={l.status} onChange={(e) => set('status', e.target.value as ContentStatus)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
            <p className="mt-1 text-xs text-muted">Only “Published” is visible to the public.</p></div>
          <div><label className="label" htmlFor="del">Delegation</label>
            <select id="del" className="field" value={l.delegationId} onChange={(e) => set('delegationId', e.target.value)}>{c.delegations.map((d) => <option key={d.id} value={d.id}>{tr(d.name, 'en')} ({d.insCode})</option>)}</select></div>
          <div><label className="label" htmlFor="cat">Category</label>
            <select id="cat" className="field" value={l.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)}><option value="">— None —</option>{c.categories.map((x) => <option key={x.id} value={x.id}>{tr(x.name, 'en')}</option>)}</select></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="slug">URL slug</label>
            <input id="slug" className="field" value={l.slug} placeholder={slugify(tr(l.name, 'en')) || 'generated-from-english-name'} onChange={(e) => set('slug', slugify(e.target.value))} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={l.featured} onChange={(e) => set('featured', e.target.checked)} /> Highlight on homepage</label>
        </section>

        <section className="card space-y-5 p-5">
          <LocalizedField id="name" label="Name" value={l.name} onChange={(v) => set('name', v)} />
          <LocalizedField id="summary" label="Short description" value={l.summary} onChange={(v) => set('summary', v)} multiline rows={3} />
          <LocalizedField id="story" label="Long story (blank line = new paragraph)" value={l.story} onChange={(v) => set('story', v)} multiline rows={10} />
          <LocalizedField id="address" label="Address / descriptive location" value={l.address} onChange={(v) => set('address', v)} />
        </section>

        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="font-display font-bold sm:col-span-2">Map position</h2>
          <p className="text-xs text-muted sm:col-span-2">Enter coordinates only from a verified source (site visit, owner confirmation, official record). Never estimate from a name. Pins are shown only when “Verified”.</p>
          <div><label className="label" htmlFor="lat">Latitude</label><input id="lat" inputMode="decimal" className="field" value={l.lat ?? ''} onChange={(e) => set('lat', num(e.target.value))} /></div>
          <div><label className="label" htmlFor="lng">Longitude</label><input id="lng" inputMode="decimal" className="field" value={l.lng ?? ''} onChange={(e) => set('lng', num(e.target.value))} /></div>
          <div><label className="label" htmlFor="cs">Verification status</label>
            <select id="cs" className="field" value={l.coordinateStatus} onChange={(e) => set('coordinateStatus', e.target.value as Location['coordinateStatus'])}><option value="unverified">Unverified</option><option value="verified">Verified</option></select></div>
          <div><label className="label" htmlFor="csrc">Verification source</label><input id="csrc" className="field" value={l.coordinateSource ?? ''} onChange={(e) => set('coordinateSource', e.target.value || null)} placeholder="e.g. On-site GPS reading, 2026-12-01" /></div>
        </section>

        <section className="card grid gap-4 p-5">
          <h2 className="font-display font-bold">Media & sources</h2>
          <div><label className="label" htmlFor="cover">Cover image</label>
            <select id="cover" className="field" value={l.coverMediaId ?? ''} onChange={(e) => set('coverMediaId', e.target.value || null)}>
              <option value="">— None —</option>{media.map((m) => <option key={m.id} value={m.id}>{tr(m.alt, 'en') || m.path}{m.credit ? ` — © ${m.credit}` : ' — no credit'}</option>)}
            </select>
            <p className="mt-1 text-xs text-muted">Upload images and record credits/permissions in <Link className="underline" to="/admin/media">Media</Link>.</p></div>
          <div><label className="label" htmlFor="src">Source & verification notes (internal)</label><textarea id="src" rows={3} className="field" value={l.sourceNotes ?? ''} onChange={(e) => set('sourceNotes', e.target.value || null)} /></div>
          <div>
            <p className="label">Linked Instagram posts</p>
            {posts.length ? <ul className="text-sm">{posts.map((p) => <li key={p.id}><Link className="underline" to={`/admin/posts/${p.id}`}>{p.label}</Link></li>)}</ul> : <p className="text-sm text-muted">None. Link posts from the post editor.</p>}
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className="btn btn-primary" onClick={() => save('published')}>Save & publish</button>
          <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('needs_review')}>Save for review</button>
          {l.status === 'published' && <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('draft')}>Unpublish</button>}
          {!isNew && l.status !== 'archived' && <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('archived')}>Archive</button>}
          {!isNew && (
            <ConfirmButton label={<><Trash2 className="h-4 w-4" /> Delete</>} title="Delete this location?"
              body="This permanently deletes the location. Linked Instagram posts are kept but unlinked. This cannot be undone — consider archiving instead."
              onConfirm={async () => { try { await deleteLocation(l.id); await reload(); navigate('/admin/locations'); } catch (e) { setMsg({ text: (e as Error).message, kind: 'error' }); } }} />
          )}
        </div>
        {!isNew && <p className="text-xs text-muted">Created {new Date(l.createdAt).toLocaleString()} · Updated {new Date(l.updatedAt).toLocaleString()}</p>}
      </div>

      <Dialog open={preview} onClose={() => setPreview(false)} title="Preview" wide>
        <div className="-mx-6 -mb-6 overflow-hidden rounded-b-3xl border-t border-line">
          <LocationDetail location={l} catalog={c} preview />
        </div>
      </Dialog>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import type { ContentStatus, SocialPost } from '../../../types';
import { STATUSES } from '../../../types';
import { tr } from '../../../lib/localize';
import { useAdmin } from '../AdminApp';
import { deletePost, savePost } from '../api';
import { hasErrors, postIssues } from '../validation';
import { ConfirmButton, IssueList, LocalizedField, PageHeader, STATUS_LABEL, Toast } from '../ui';
import { parseInstagramUrl } from '../../instagram/instagram';
import { InstagramEmbed } from '../../instagram/InstagramEmbed';

const METRICS = ['views', 'plays', 'reach', 'likes', 'comments', 'shares', 'saves'];

function blank(order: number): SocialPost {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), url: '', label: '', delegationId: null, locationId: null, caption: {}, metricType: null, metricValue: null, metricSource: null,
    metricVerifiedAt: null, status: 'draft', featured: false, featuredRank: null, sortOrder: order, reviewNote: null, createdAt: now, updatedAt: now };
}

export default function PostEditPage() {
  const { id } = useParams();
  const { catalog: c, reload } = useAdmin();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const existing = c.socialPosts.find((p) => p.id === id);
  const [p, setP] = useState<SocialPost>(() => existing ?? blank(c.socialPosts.length + 1));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);
  const issues = useMemo(() => postIssues(p, c), [p, c]);
  const set = <K extends keyof SocialPost>(k: K, v: SocialPost[K]) => setP((x) => ({ ...x, [k]: v }));
  if (!isNew && !existing) return <p className="text-muted">Post not found. <Link to="/admin/posts" className="underline">Back</Link></p>;
  const parsed = parseInstagramUrl(p.url.trim());
  const locs = c.locations.filter((l) => !p.delegationId || l.delegationId === p.delegationId);

  const save = async (status?: ContentStatus) => {
    const next = { ...p, url: p.url.trim(), status: status ?? p.status, featuredRank: p.featured ? p.featuredRank : null };
    if (hasErrors(postIssues(next, c))) { setMsg({ text: 'Fix the errors before saving.', kind: 'error' }); return; }
    setBusy(true); setMsg(null);
    try {
      await savePost(next, isNew); await reload(); setP(next);
      setMsg({ text: `Saved (${STATUS_LABEL[next.status]}).`, kind: 'ok' });
      if (isNew) navigate(`/admin/posts/${next.id}`, { replace: true });
    } catch (e) { setMsg({ text: (e as Error).message, kind: 'error' }); } finally { setBusy(false); }
  };

  return (
    <div className="grid max-w-6xl gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <Link to="/admin/posts" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4" /> Posts</Link>
        <PageHeader title={isNew ? 'New Instagram post' : p.label}>
          <button type="button" disabled={busy} className="btn btn-primary" onClick={() => save()}><Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save'}</button>
        </PageHeader>
        <div className="space-y-4">
          <Toast message={msg?.text ?? null} kind={msg?.kind} />
          <div className="card p-4"><IssueList issues={issues} />{!issues.length && <p className="text-sm text-emerald-300">No issues.</p>}</div>
          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label" htmlFor="url">Instagram URL (stored exactly as entered)</label>
              <input id="url" dir="ltr" className="field font-mono text-xs" value={p.url} onChange={(e) => set('url', e.target.value)} placeholder="https://www.instagram.com/reel/…" />
              {parsed && <p className="mt-1 text-xs text-muted">Detected: {parsed.type} · {parsed.shortcode}</p>}</div>
            <div className="sm:col-span-2"><label className="label" htmlFor="label">Display label</label><input id="label" className="field" value={p.label} onChange={(e) => set('label', e.target.value)} /></div>
            <div><label className="label" htmlFor="pd">Delegation</label>
              <select id="pd" className="field" value={p.delegationId ?? ''} onChange={(e) => set('delegationId', e.target.value || null)}><option value="">— None —</option>{c.delegations.map((d) => <option key={d.id} value={d.id}>{tr(d.name, 'en')}</option>)}</select></div>
            <div><label className="label" htmlFor="pl">Linked location (only when confirmed)</label>
              <select id="pl" className="field" value={p.locationId ?? ''} onChange={(e) => set('locationId', e.target.value || null)}><option value="">— Not linked —</option>{locs.map((l) => <option key={l.id} value={l.id}>{tr(l.name, 'en')}</option>)}</select></div>
            <div><label className="label" htmlFor="ps">Status</label>
              <select id="ps" className="field" value={p.status} onChange={(e) => set('status', e.target.value as ContentStatus)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
            <div><label className="label" htmlFor="po">Display order</label><input id="po" type="number" className="field" value={p.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value) || 0)} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured on homepage</label>
            {p.featured && <div><label className="label" htmlFor="fr">Featured position (1–5)</label><input id="fr" type="number" min={1} max={5} className="field" value={p.featuredRank ?? ''} onChange={(e) => set('featuredRank', e.target.value ? Number(e.target.value) : null)} /></div>}
            <div className="sm:col-span-2"><label className="label" htmlFor="rn">Review note (internal; clear it once resolved)</label><textarea id="rn" rows={2} className="field" value={p.reviewNote ?? ''} onChange={(e) => set('reviewNote', e.target.value || null)} /></div>
          </section>
          <section className="card p-5"><LocalizedField id="caption" label="Approved caption / summary (optional)" value={p.caption} onChange={(v) => set('caption', v)} multiline rows={3} /></section>
          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <h2 className="font-display font-bold sm:col-span-2">Verified metric (optional)</h2>
            <p className="text-xs text-muted sm:col-span-2">Record a figure only from Instagram Insights or another verifiable source. Different metric types (e.g. views vs. reach) are never compared.</p>
            <div><label className="label" htmlFor="mt">Metric type</label><select id="mt" className="field" value={p.metricType ?? ''} onChange={(e) => set('metricType', e.target.value || null)}><option value="">—</option>{METRICS.map((m) => <option key={m}>{m}</option>)}</select></div>
            <div><label className="label" htmlFor="mv">Value</label><input id="mv" type="number" min={0} className="field" value={p.metricValue ?? ''} onChange={(e) => set('metricValue', e.target.value ? Number(e.target.value) : null)} /></div>
            <div><label className="label" htmlFor="msrc">Source</label><input id="msrc" className="field" value={p.metricSource ?? ''} onChange={(e) => set('metricSource', e.target.value || null)} placeholder="Instagram Insights" /></div>
            <div><label className="label" htmlFor="md">Verified on</label><input id="md" type="date" className="field" value={p.metricVerifiedAt ?? ''} onChange={(e) => set('metricVerifiedAt', e.target.value || null)} /></div>
          </section>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} className="btn btn-primary" onClick={() => save('published')}>Save & publish</button>
            {p.status === 'published' && <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('draft')}>Unpublish</button>}
            {!isNew && p.status !== 'archived' && <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('archived')}>Archive</button>}
            {!isNew && <ConfirmButton label={<><Trash2 className="h-4 w-4" /> Delete</>} title="Delete this post?" body="The post record will be permanently removed from the platform (nothing changes on Instagram). This cannot be undone."
              onConfirm={async () => { try { await deletePost(p.id); await reload(); navigate('/admin/posts'); } catch (e) { setMsg({ text: (e as Error).message, kind: 'error' }); } }} />}
          </div>
        </div>
      </div>
      <aside>
        <p className="label">Embed preview</p>
        {parsed ? <InstagramEmbed key={p.url} post={p} /> : <p className="text-sm text-muted">Enter a valid URL to preview.</p>}
      </aside>
    </div>
  );
}

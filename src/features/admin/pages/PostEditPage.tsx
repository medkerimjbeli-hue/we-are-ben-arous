import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import type { ContentStatus, SocialPost } from '../../../types';
import { STATUSES } from '../../../types';
import { tr } from '../../../lib/localize';
import { useAdmin } from '../AdminApp';
import { deletePost, savePost } from '../api';
import { hasErrors, postIssues } from '../validation';
import { ConfirmButton, IssueList, LocalizedField, PageHeader, Section, Toast, useA, useErrorText, type Msg } from '../ui';
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
  const { a, lang } = useA();
  const errText = useErrorText();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const existing = c.socialPosts.find((p) => p.id === id);
  const [p, setP] = useState<SocialPost>(() => existing ?? blank(c.socialPosts.length + 1));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const issues = useMemo(() => postIssues(p, c), [p, c]);
  const set = <K extends keyof SocialPost>(k: K, v: SocialPost[K]) => setP((x) => ({ ...x, [k]: v }));
  if (!isNew && !existing) return <p className="text-muted">{a('common.notFound')} <Link to="/admin/posts" className="underline">{a('common.back')}</Link></p>;
  const parsed = parseInstagramUrl(p.url.trim());
  const locs = c.locations.filter((l) => !p.delegationId || l.delegationId === p.delegationId);

  const save = async (status?: ContentStatus) => {
    const next = { ...p, url: p.url.trim(), status: status ?? p.status, featuredRank: p.featured ? p.featuredRank : null };
    if (hasErrors(postIssues(next, c))) { setMsg({ text: a('common.fixErrors'), kind: 'error' }); return; }
    setBusy(true); setMsg(null);
    try {
      await savePost(next, isNew); await reload(); setP(next);
      setMsg({ text: a('common.saved', { status: a(`status.${next.status}`) }), kind: 'ok' });
      if (isNew) navigate(`/admin/posts/${next.id}`, { replace: true });
    } catch (e) { setMsg({ text: errText(e), kind: 'error' }); } finally { setBusy(false); }
  };

  return (
    <div className="grid max-w-6xl gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <Link to="/admin/posts" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /> {a('posts.title')}</Link>
        <PageHeader title={isNew ? a('posts.newTitle') : p.label}>
          <button type="button" disabled={busy} className="btn btn-primary" onClick={() => save()}><Save className="h-4 w-4" aria-hidden /> {busy ? a('common.saving') : a('common.save')}</button>
        </PageHeader>
        <div className="space-y-4">
          <Toast message={msg?.text ?? null} kind={msg?.kind} />
          <div className="card p-4"><IssueList issues={issues} /></div>
          <Section className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label" htmlFor="url">{a('posts.url')}</label>
              <input id="url" dir="ltr" className="field font-mono text-xs" value={p.url} onChange={(e) => set('url', e.target.value)} placeholder="https://www.instagram.com/reel/…" />
              {parsed && <p className="mt-1 text-xs text-muted">{a('posts.detected', { type: a(`posts.types.${parsed.type}`), code: parsed.shortcode })}</p>}</div>
            <div className="sm:col-span-2"><label className="label" htmlFor="label">{a('posts.label')}</label><input id="label" dir="auto" className="field" value={p.label} onChange={(e) => set('label', e.target.value)} /></div>
            <div><label className="label" htmlFor="pd">{a('common.delegation')}</label>
              <select id="pd" className="field" value={p.delegationId ?? ''} onChange={(e) => set('delegationId', e.target.value || null)}><option value="">{a('common.none')}</option>{c.delegations.map((d) => <option key={d.id} value={d.id}>{tr(d.name, lang)}</option>)}</select></div>
            <div><label className="label" htmlFor="pl">{a('posts.locationField')}</label>
              <select id="pl" className="field" value={p.locationId ?? ''} onChange={(e) => set('locationId', e.target.value || null)}><option value="">{a('posts.notLinked')}</option>{locs.map((l) => <option key={l.id} value={l.id}>{tr(l.name, lang)}</option>)}</select></div>
            <div><label className="label" htmlFor="ps">{a('common.status')}</label>
              <select id="ps" className="field" value={p.status} onChange={(e) => set('status', e.target.value as ContentStatus)}>{STATUSES.map((s) => <option key={s} value={s}>{a(`status.${s}`)}</option>)}</select></div>
            <div><label className="label" htmlFor="po">{a('posts.orderField')}</label><input id="po" type="number" className="field" value={p.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value) || 0)} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.featured} onChange={(e) => set('featured', e.target.checked)} /> {a('posts.featuredField')}</label>
            {p.featured && <div><label className="label" htmlFor="fr">{a('posts.featuredPos')}</label><input id="fr" type="number" min={1} max={5} className="field" value={p.featuredRank ?? ''} onChange={(e) => set('featuredRank', e.target.value ? Number(e.target.value) : null)} /></div>}
            <div className="sm:col-span-2"><label className="label" htmlFor="rn">{a('posts.reviewNote')}</label><textarea id="rn" rows={2} dir="auto" className="field" value={p.reviewNote ?? ''} onChange={(e) => set('reviewNote', e.target.value || null)} /></div>
          </Section>
          <Section><LocalizedField id="caption" label={a('posts.caption')} value={p.caption} onChange={(v) => set('caption', v)} multiline rows={3} /></Section>
          <Section title={a('posts.metricTitle')} className="grid gap-4 sm:grid-cols-2 [&>h2]:sm:col-span-2">
            <p className="text-xs text-muted sm:col-span-2">{a('posts.metricHint')}</p>
            <div><label className="label" htmlFor="mt">{a('posts.metricType')}</label><select id="mt" className="field" value={p.metricType ?? ''} onChange={(e) => set('metricType', e.target.value || null)}><option value="">—</option>{METRICS.map((m) => <option key={m} value={m}>{a(`posts.metrics.${m}`)}</option>)}</select></div>
            <div><label className="label" htmlFor="mv">{a('posts.metricValue')}</label><input id="mv" type="number" min={0} className="field" value={p.metricValue ?? ''} onChange={(e) => set('metricValue', e.target.value ? Number(e.target.value) : null)} /></div>
            <div><label className="label" htmlFor="msrc">{a('posts.metricSource')}</label><input id="msrc" className="field" value={p.metricSource ?? ''} onChange={(e) => set('metricSource', e.target.value || null)} placeholder={a('posts.metricSourcePlaceholder')} /></div>
            <div><label className="label" htmlFor="md">{a('posts.metricDate')}</label><input id="md" type="date" className="field" value={p.metricVerifiedAt ?? ''} onChange={(e) => set('metricVerifiedAt', e.target.value || null)} /></div>
          </Section>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} className="btn btn-primary" onClick={() => save('published')}>{a('locations.publish')}</button>
            <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('needs_review')}>{a('locations.review')}</button>
            {p.status === 'published' && <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('draft')}>{a('locations.unpublish')}</button>}
            {!isNew && p.status !== 'archived' && <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('archived')}>{a('locations.archive')}</button>}
            {!isNew && <ConfirmButton label={<><Trash2 className="h-4 w-4" aria-hidden /> {a('common.delete')}</>} title={a('posts.deleteTitle')} body={a('posts.deleteBody')}
              onConfirm={async () => { try { await deletePost(p.id); await reload(); navigate('/admin/posts'); } catch (e) { setMsg({ text: errText(e), kind: 'error' }); } }} />}
          </div>
        </div>
      </div>
      <aside>
        <p className="label">{a('posts.embedPreview')}</p>
        {parsed ? <InstagramEmbed key={p.url} post={p} /> : <p className="text-sm text-muted">{a('posts.enterUrl')}</p>}
      </aside>
    </div>
  );
}

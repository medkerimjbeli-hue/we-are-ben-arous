import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Eye, Save, Trash2 } from 'lucide-react';
import type { ContentStatus, Location, Revision } from '../../../types';
import { STATUSES } from '../../../types';
import { slugify, tr } from '../../../lib/localize';
import { useAdmin } from '../AdminApp';
import { deleteLocation, loadRevisions, saveLocation } from '../api';
import { hasErrors, locationIssues } from '../validation';
import { ConfirmButton, IssueList, LocalizedField, PageHeader, Section, Toast, useA, useErrorText, type Msg } from '../ui';
import { Dialog } from '../../../components/Dialog';
import { LocationDetail } from '../../locations/LocationDetail';

function blank(delegationId: string): Location {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), kind: 'place', slug: '', delegationId, categoryId: null, name: {}, summary: {}, story: {}, address: {},
    lat: null, lng: null, coordinateStatus: 'unverified', coordinateSource: null, coverMediaId: null, status: 'draft', featured: false,
    sourceNotes: null, seoTitle: {}, seoDescription: {}, placeId: null, createdAt: now, updatedAt: now,
  };
}

export default function LocationEditPage() {
  const { id } = useParams();
  const { catalog: c, reload, session } = useAdmin();
  const { a, lang, fmtDate } = useA();
  const errText = useErrorText();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const existing = c.locations.find((l) => l.id === id);
  const [l, setL] = useState<Location>(() => existing ?? blank(c.delegations[0]?.id ?? ''));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState<Revision[] | null>(null);
  // Raw text for coordinate inputs so partial input like "36." can be typed.
  const [coordText, setCoordText] = useState({ lat: l.lat?.toString() ?? '', lng: l.lng?.toString() ?? '' });
  const issues = useMemo(() => locationIssues(l, c), [l, c]);
  const set = <K extends keyof Location>(k: K, v: Location[K]) => setL((x) => ({ ...x, [k]: v }));
  useEffect(() => { if (!isNew && id) loadRevisions(id, 15).then(setHistory).catch(() => setHistory(null)); }, [id, isNew, existing?.updatedAt]);

  if (!isNew && !existing) return <p className="text-muted">{a('common.notFound')} <Link to="/admin/locations" className="underline">{a('common.back')}</Link></p>;

  const save = async (status?: ContentStatus) => {
    const next = { ...l, status: status ?? l.status, slug: l.slug || slugify(tr(l.name, 'en') || tr(l.name, 'fr')) };
    if (hasErrors(locationIssues(next, c))) { setL(next); setMsg({ text: a('common.fixErrors'), kind: 'error' }); return; }
    setBusy(true); setMsg(null);
    try {
      await saveLocation(next, isNew);
      await reload();
      setL(next);
      setMsg({ text: a('common.saved', { status: a(`status.${next.status}`) }), kind: 'ok' });
      if (isNew) navigate(`/admin/locations/${next.id}`, { replace: true });
    } catch (e) { setMsg({ text: errText(e), kind: 'error' }); }
    finally { setBusy(false); }
  };
  const num = (v: string) => { const t = v.trim().replace(',', '.'); if (t === '') return null; const n = Number(t); return Number.isFinite(n) ? n : NaN; };
  const setCoord = (k: 'lat' | 'lng', v: string) => { setCoordText((x) => ({ ...x, [k]: v })); set(k, num(v)); };
  const media = c.media.filter((m) => !m.locationId || m.locationId === l.id);
  const posts = c.socialPosts.filter((p) => p.locationId === l.id);
  const places = c.locations.filter((x) => x.kind === 'place' && x.id !== l.id);

  return (
    <div className="max-w-4xl">
      <Link to="/admin/locations" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /> {a('locations.title')}</Link>
      <PageHeader title={isNew ? a('locations.newTitle') : tr(l.name, lang) || a('locations.untitled')}>
        <button type="button" className="btn btn-ghost" onClick={() => setPreview(true)}><Eye className="h-4 w-4" aria-hidden /> {a('common.preview')}</button>
        <button type="button" disabled={busy} className="btn btn-primary" onClick={() => save()}><Save className="h-4 w-4" aria-hidden /> {busy ? a('common.saving') : a('common.save')}</button>
      </PageHeader>

      <div className="space-y-4">
        <Toast message={msg?.text ?? null} kind={msg?.kind} />
        <div className="card p-4"><IssueList issues={issues} /></div>

        <Section title={a('locations.sections.general')} className="grid gap-4 sm:grid-cols-2 [&>h2]:sm:col-span-2">
          <div><label className="label" htmlFor="kind">{a('common.type')}</label>
            <select id="kind" className="field" value={l.kind} onChange={(e) => setL((x) => ({ ...x, kind: e.target.value as Location['kind'], placeId: e.target.value === 'story' ? x.placeId : null }))}>
              <option value="place">{a('common.place')}</option><option value="story">{a('common.story')}</option></select></div>
          <div><label className="label" htmlFor="status">{a('common.status')}</label>
            <select id="status" className="field" value={l.status} onChange={(e) => set('status', e.target.value as ContentStatus)}>{STATUSES.map((s) => <option key={s} value={s}>{a(`status.${s}`)}</option>)}</select>
            <p className="mt-1 text-xs text-muted">{a('locations.statusHint')}</p></div>
          <div><label className="label" htmlFor="del">{a('common.delegation')}</label>
            <select id="del" className="field" value={l.delegationId} onChange={(e) => set('delegationId', e.target.value)}>{c.delegations.map((d) => <option key={d.id} value={d.id}>{tr(d.name, lang)} ({d.insCode})</option>)}</select></div>
          <div><label className="label" htmlFor="cat">{a('common.category')}</label>
            <select id="cat" className="field" value={l.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)}><option value="">{a('common.none')}</option>{c.categories.map((x) => <option key={x.id} value={x.id}>{tr(x.name, lang)}</option>)}</select></div>
          {l.kind === 'story' && (
            <div className="sm:col-span-2"><label className="label" htmlFor="place">{a('locations.aboutPlace')}</label>
              <select id="place" className="field" value={l.placeId ?? ''} onChange={(e) => set('placeId', e.target.value || null)}><option value="">{a('common.none')}</option>{places.map((x) => <option key={x.id} value={x.id}>{tr(x.name, lang)}</option>)}</select></div>
          )}
          <div className="sm:col-span-2"><label className="label" htmlFor="slug">{a('common.slug')}</label>
            <input id="slug" dir="ltr" className="field" value={l.slug} placeholder={slugify(tr(l.name, 'en')) || a('locations.slugPlaceholder')} onChange={(e) => set('slug', slugify(e.target.value))} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={l.featured} onChange={(e) => set('featured', e.target.checked)} /> {a('locations.highlight')}</label>
        </Section>

        <Section title={a('locations.sections.content')} className="space-y-5">
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-200">{a('locations.editorialHint')}</p>
          <LocalizedField id="name" label={a('locations.nameField')} value={l.name} onChange={(v) => set('name', v)} />
          <LocalizedField id="summary" label={a('locations.summaryField')} value={l.summary} onChange={(v) => set('summary', v)} multiline rows={3} />
          <LocalizedField id="story" label={a('locations.storyField')} value={l.story} onChange={(v) => set('story', v)} multiline rows={10} />
          <LocalizedField id="address" label={a('locations.addressField')} value={l.address} onChange={(v) => set('address', v)} />
        </Section>

        <Section title={a('locations.sections.map')} className="grid gap-4 sm:grid-cols-2 [&>h2]:sm:col-span-2">
          <p className="text-xs text-muted sm:col-span-2">{a('locations.mapHint')}</p>
          <div><label className="label" htmlFor="lat">{a('locations.lat')}</label><input id="lat" dir="ltr" inputMode="decimal" className="field" value={coordText.lat} onChange={(e) => setCoord('lat', e.target.value)} /></div>
          <div><label className="label" htmlFor="lng">{a('locations.lng')}</label><input id="lng" dir="ltr" inputMode="decimal" className="field" value={coordText.lng} onChange={(e) => setCoord('lng', e.target.value)} /></div>
          <div><label className="label" htmlFor="cs">{a('locations.verification')}</label>
            <select id="cs" className="field" value={l.coordinateStatus} onChange={(e) => set('coordinateStatus', e.target.value as Location['coordinateStatus'])}><option value="unverified">{a('locations.unverified')}</option><option value="verified">{a('locations.verified')}</option></select></div>
          <div><label className="label" htmlFor="csrc">{a('locations.verificationSource')}</label><input id="csrc" className="field" value={l.coordinateSource ?? ''} onChange={(e) => set('coordinateSource', e.target.value || null)} placeholder={a('locations.sourcePlaceholder')} /></div>
          {l.lat != null && l.lng != null && (
            <a className="inline-flex items-center gap-1 text-sm underline sm:col-span-2" target="_blank" rel="noopener noreferrer" href={`https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=17/${l.lat}/${l.lng}`}>
              {a('locations.pickOnMap')} <ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
          )}
        </Section>

        <Section title={a('locations.sections.media')} className="grid gap-4">
          <div><label className="label" htmlFor="cover">{a('locations.cover')}</label>
            <select id="cover" className="field" value={l.coverMediaId ?? ''} onChange={(e) => set('coverMediaId', e.target.value || null)}>
              <option value="">{a('common.none')}</option>{media.map((m) => <option key={m.id} value={m.id}>{tr(m.alt, lang) || m.path}{m.credit ? ` — © ${m.credit}` : ` — ${a('media.noCredit')}`}</option>)}
            </select>
            {l.coverMediaId && (() => { const m = c.media.find((x) => x.id === l.coverMediaId); return m?.url ? <img src={m.url} alt={tr(m.alt, lang)} className="mt-3 h-40 rounded-xl object-cover" /> : null; })()}
            <p className="mt-1 text-xs text-muted">{a('locations.coverHint')} <Link className="underline" to="/admin/media">{a('nav.media')}</Link></p></div>
          <div><label className="label" htmlFor="src">{a('locations.sourceNotes')}</label><textarea id="src" rows={3} className="field" dir="auto" value={l.sourceNotes ?? ''} onChange={(e) => set('sourceNotes', e.target.value || null)} /></div>
          <div>
            <p className="label">{a('locations.linkedPosts')}</p>
            {posts.length ? <ul className="text-sm">{posts.map((p) => <li key={p.id}><Link className="underline" to={`/admin/posts/${p.id}`}>{p.label}</Link></li>)}</ul> : <p className="text-sm text-muted">{a('locations.noLinkedPosts')}</p>}
          </div>
        </Section>

        <Section title={a('locations.sections.seo')} className="space-y-5">
          <LocalizedField id="seoTitle" label={a('locations.seoTitle')} value={l.seoTitle} onChange={(v) => set('seoTitle', v)} hint={a('locations.seoHint')} />
          <LocalizedField id="seoDesc" label={a('locations.seoDescription')} value={l.seoDescription} onChange={(v) => set('seoDescription', v)} multiline rows={2} />
        </Section>

        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className="btn btn-primary" onClick={() => save('published')}>{a('locations.publish')}</button>
          <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('needs_review')}>{a('locations.review')}</button>
          {l.status === 'published' && <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('draft')}>{a('locations.unpublish')}</button>}
          {!isNew && l.status !== 'archived' && <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save('archived')}>{a('locations.archive')}</button>}
          {!isNew && (
            <ConfirmButton label={<><Trash2 className="h-4 w-4" aria-hidden /> {a('common.delete')}</>} title={a('locations.deleteTitle')} body={a('locations.deleteBody')}
              onConfirm={async () => { try { await deleteLocation(l.id); await reload(); navigate('/admin/locations'); } catch (e) { setMsg({ text: errText(e), kind: 'error' }); } }} />
          )}
        </div>
        {!isNew && <p className="text-xs text-muted">{a('common.createdUpdated', { created: fmtDate(l.createdAt), updated: fmtDate(l.updatedAt) })}</p>}

        {!isNew && (
          <Section title={a('locations.sections.history')}>
            {history === null ? <p className="text-sm text-muted">{a('history.unavailable')}</p> : history.length === 0 ? <p className="text-sm text-muted">{a('history.empty')}</p> : (
              <ol className="space-y-1 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="text-muted"><span className="text-white">{a(`history.actions.${h.action}`)}</span> · {fmtDate(h.changedAt)} · {a('history.by', { who: h.changedBy === session.user.id ? a('history.you') : a('history.someone') })}
                    {typeof h.snapshot.status === 'string' && <> · {a(`status.${h.snapshot.status}`)}</>}</li>
                ))}
              </ol>
            )}
          </Section>
        )}
      </div>

      <Dialog open={preview} onClose={() => setPreview(false)} title={a('locations.previewTitle')} wide>
        <div className="-mx-6 -mb-6 overflow-hidden rounded-b-3xl border-t border-line">
          <LocationDetail location={l} catalog={c} preview />
        </div>
      </Dialog>
    </div>
  );
}

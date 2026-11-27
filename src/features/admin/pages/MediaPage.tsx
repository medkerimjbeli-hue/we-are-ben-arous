import { useState, type FormEvent } from 'react';
import { Trash2, Upload } from 'lucide-react';
import type { Media, MediaPermission } from '../../../types';
import { tr } from '../../../lib/localize';
import { useAdmin } from '../AdminApp';
import { deleteMedia, updateMedia, uploadMedia } from '../api';
import { uploadIssue, UPLOAD_TYPES } from '../validation';
import { ConfirmButton, PageHeader, Toast, useA, useErrorText, type Msg } from '../ui';

const PERMS: MediaPermission[] = ['owned', 'licensed', 'permission_granted', 'unknown'];

export default function MediaPage() {
  const { catalog: c, reload } = useAdmin();
  const { a, lang } = useA();
  const errText = useErrorText();
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ altEn: '', altFr: '', altAr: '', credit: '', sourceUrl: '', permission: 'owned' as MediaPermission, locationId: '' });

  const pick = (f: File | null) => {
    setFile(null); setMsg(null);
    if (!f) return;
    const bad = uploadIssue(f);
    if (bad) { setMsg({ text: a(`media.${bad}`), kind: 'error' }); return; }
    setFile(f);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      await uploadMedia(file, { alt: { en: meta.altEn, fr: meta.altFr, ar: meta.altAr }, credit: meta.credit || null, sourceUrl: meta.sourceUrl || null, permission: meta.permission, locationId: meta.locationId || null });
      await reload(); setFile(null); (e.target as HTMLFormElement).reset();
      setMeta({ altEn: '', altFr: '', altAr: '', credit: '', sourceUrl: '', permission: 'owned', locationId: '' });
      setMsg({ text: a('media.uploaded'), kind: 'ok' });
    } catch (err) { setMsg({ text: errText(err), kind: 'error' }); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-6xl">
      <PageHeader title={a('media.title')} />
      <p className="mb-4 text-sm text-muted">{a('media.intro')}</p>
      <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="file">{a('media.image')}</label><input id="file" type="file" accept={UPLOAD_TYPES.join(',')} required onChange={(e) => pick(e.target.files?.[0] ?? null)} className="field" /></div>
        <div><label className="label" htmlFor="aen">{a('media.alt', { lang: 'EN' })}</label><input id="aen" lang="en" dir="ltr" className="field" value={meta.altEn} onChange={(e) => setMeta({ ...meta, altEn: e.target.value })} required aria-describedby="alt-hint" /></div>
        <div><label className="label" htmlFor="afr">{a('media.alt', { lang: 'FR' })}</label><input id="afr" lang="fr" dir="ltr" className="field" value={meta.altFr} onChange={(e) => setMeta({ ...meta, altFr: e.target.value })} /></div>
        <div><label className="label" htmlFor="aar">{a('media.alt', { lang: 'AR' })}</label><input id="aar" dir="rtl" lang="ar" className="field" value={meta.altAr} onChange={(e) => setMeta({ ...meta, altAr: e.target.value })} /></div>
        <p id="alt-hint" className="self-end text-xs text-muted">{a('media.altHint')}</p>
        <div><label className="label" htmlFor="cr">{a('media.credit')}</label><input id="cr" dir="auto" className="field" value={meta.credit} onChange={(e) => setMeta({ ...meta, credit: e.target.value })} /></div>
        <div><label className="label" htmlFor="su">{a('media.sourceUrl')}</label><input id="su" dir="ltr" type="url" className="field" value={meta.sourceUrl} onChange={(e) => setMeta({ ...meta, sourceUrl: e.target.value })} /></div>
        <div><label className="label" htmlFor="pm">{a('media.permission')}</label><select id="pm" className="field" value={meta.permission} onChange={(e) => setMeta({ ...meta, permission: e.target.value as MediaPermission })}>{PERMS.map((k) => <option key={k} value={k}>{a(`media.perms.${k}`)}</option>)}</select></div>
        <div><label className="label" htmlFor="ml">{a('media.location')}</label><select id="ml" className="field" value={meta.locationId} onChange={(e) => setMeta({ ...meta, locationId: e.target.value })}><option value="">{a('media.noLocation')}</option>{c.locations.map((l) => <option key={l.id} value={l.id}>{tr(l.name, lang)}</option>)}</select></div>
        <div className="flex items-end"><button disabled={busy || !file} className="btn btn-primary"><Upload className="h-4 w-4" aria-hidden /> {busy ? a('media.uploading') : a('media.upload')}</button></div>
      </form>
      <Toast message={msg?.text ?? null} kind={msg?.kind} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {c.media.map((m) => <MediaCard key={m.id} m={m} onChange={async (x) => { try { await updateMedia(x); await reload(); setMsg({ text: a('common.savedPlain'), kind: 'ok' }); } catch (e) { setMsg({ text: errText(e), kind: 'error' }); } }}
          onDelete={async () => { try { await deleteMedia(m); await reload(); } catch (e) { setMsg({ text: errText(e), kind: 'error' }); } }} />)}
        {!c.media.length && <p className="text-sm text-muted">{a('media.noMedia')}</p>}
      </div>
    </div>
  );
}

function MediaCard({ m, onChange, onDelete }: { m: Media; onChange: (m: Media) => void; onDelete: () => void }) {
  const { catalog: c } = useAdmin();
  const { a, lang } = useA();
  const [x, setX] = useState(m);
  return (
    <div className={`card overflow-hidden ${!x.credit || x.permission === 'unknown' ? 'border-amber-500/60' : ''}`}>
      <img src={m.url} alt={tr(m.alt, lang)} className="aspect-[4/3] w-full object-cover" loading="lazy" />
      <div className="space-y-2 p-3 text-sm">
        <input aria-label={a('media.alt', { lang: 'EN' })} dir="ltr" className="field" value={x.alt.en ?? ''} onChange={(e) => setX({ ...x, alt: { ...x.alt, en: e.target.value } })} />
        <input aria-label={a('media.alt', { lang: 'AR' })} dir="rtl" lang="ar" className="field" value={x.alt.ar ?? ''} onChange={(e) => setX({ ...x, alt: { ...x.alt, ar: e.target.value } })} />
        <input aria-label={a('media.credit')} placeholder={a('media.credit')} dir="auto" className="field" value={x.credit ?? ''} onChange={(e) => setX({ ...x, credit: e.target.value || null })} />
        <select aria-label={a('media.permission')} className="field" value={x.permission} onChange={(e) => setX({ ...x, permission: e.target.value as MediaPermission })}>{PERMS.map((k) => <option key={k} value={k}>{a(`media.perms.${k}`)}</option>)}</select>
        <select aria-label={a('media.location')} className="field" value={x.locationId ?? ''} onChange={(e) => setX({ ...x, locationId: e.target.value || null })}><option value="">{a('media.noLocation')}</option>{c.locations.map((l) => <option key={l.id} value={l.id}>{tr(l.name, lang)}</option>)}</select>
        <div className="flex gap-2">
          <button className="btn btn-primary !py-2" onClick={() => onChange(x)}>{a('common.save')}</button>
          <ConfirmButton className="btn btn-ghost !py-2 text-primary" ariaLabel={a('common.delete')} label={<Trash2 className="h-4 w-4" aria-hidden />} title={a('media.deleteTitle')} body={a('media.deleteBody')} onConfirm={onDelete} />
        </div>
      </div>
    </div>
  );
}

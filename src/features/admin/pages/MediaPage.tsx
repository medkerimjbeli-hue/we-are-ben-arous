import { useState, type FormEvent } from 'react';
import { Trash2, Upload } from 'lucide-react';
import type { Media, MediaPermission } from '../../../types';
import { tr } from '../../../lib/localize';
import { useAdmin } from '../AdminApp';
import { deleteMedia, updateMedia, uploadMedia } from '../api';
import { ConfirmButton, PageHeader, Toast } from '../ui';

const PERMS: Record<MediaPermission, string> = { owned: 'Owned by We Are Ben Arous', licensed: 'Licensed (e.g. Creative Commons)', permission_granted: 'Permission granted by author', unknown: 'Unknown — do not publish' };

export default function MediaPage() {
  const { catalog: c, reload } = useAdmin();
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ altEn: '', altFr: '', altAr: '', credit: '', sourceUrl: '', permission: 'owned' as MediaPermission, locationId: '' });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setMsg({ text: 'Files must be 8 MB or smaller.', kind: 'error' }); return; }
    setBusy(true); setMsg(null);
    try {
      await uploadMedia(file, { alt: { en: meta.altEn, fr: meta.altFr, ar: meta.altAr }, credit: meta.credit || null, sourceUrl: meta.sourceUrl || null, permission: meta.permission, locationId: meta.locationId || null });
      await reload(); setFile(null); (e.target as HTMLFormElement).reset();
      setMsg({ text: 'Uploaded. Set it as a cover from the location editor.', kind: 'ok' });
    } catch (err) { setMsg({ text: (err as Error).message, kind: 'error' }); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-6xl">
      <PageHeader title="Media" />
      <p className="mb-4 text-sm text-muted">Upload only images you own or have permission to use. Do not download or re-upload Instagram media without the author’s permission. JPEG, PNG, WebP or AVIF, max 8 MB.</p>
      <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="file">Image</label><input id="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="field" /></div>
        <div><label className="label" htmlFor="aen">Alt text (EN)</label><input id="aen" className="field" value={meta.altEn} onChange={(e) => setMeta({ ...meta, altEn: e.target.value })} required /></div>
        <div><label className="label" htmlFor="afr">Alt text (FR)</label><input id="afr" className="field" value={meta.altFr} onChange={(e) => setMeta({ ...meta, altFr: e.target.value })} /></div>
        <div><label className="label" htmlFor="aar">Alt text (AR)</label><input id="aar" dir="rtl" lang="ar" className="field" value={meta.altAr} onChange={(e) => setMeta({ ...meta, altAr: e.target.value })} /></div>
        <div><label className="label" htmlFor="cr">Photographer / credit</label><input id="cr" className="field" value={meta.credit} onChange={(e) => setMeta({ ...meta, credit: e.target.value })} /></div>
        <div><label className="label" htmlFor="su">Source URL</label><input id="su" type="url" className="field" value={meta.sourceUrl} onChange={(e) => setMeta({ ...meta, sourceUrl: e.target.value })} /></div>
        <div><label className="label" htmlFor="pm">Permission</label><select id="pm" className="field" value={meta.permission} onChange={(e) => setMeta({ ...meta, permission: e.target.value as MediaPermission })}>{Object.entries(PERMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label className="label" htmlFor="ml">Location (gallery)</label><select id="ml" className="field" value={meta.locationId} onChange={(e) => setMeta({ ...meta, locationId: e.target.value })}><option value="">— None —</option>{c.locations.map((l) => <option key={l.id} value={l.id}>{tr(l.name, 'en')}</option>)}</select></div>
        <div className="flex items-end"><button disabled={busy || !file} className="btn btn-primary"><Upload className="h-4 w-4" /> {busy ? 'Uploading…' : 'Upload'}</button></div>
      </form>
      <Toast message={msg?.text ?? null} kind={msg?.kind} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {c.media.map((m) => <MediaCard key={m.id} m={m} onChange={async (x) => { try { await updateMedia(x); await reload(); setMsg({ text: 'Saved.', kind: 'ok' }); } catch (e) { setMsg({ text: (e as Error).message, kind: 'error' }); } }}
          onDelete={async () => { try { await deleteMedia(m); await reload(); } catch (e) { setMsg({ text: (e as Error).message, kind: 'error' }); } }} />)}
        {!c.media.length && <p className="text-sm text-muted">No media yet.</p>}
      </div>
    </div>
  );
}

function MediaCard({ m, onChange, onDelete }: { m: Media; onChange: (m: Media) => void; onDelete: () => void }) {
  const { catalog: c } = useAdmin();
  const [x, setX] = useState(m);
  return (
    <div className="card overflow-hidden">
      <img src={m.url} alt={tr(m.alt, 'en')} className="aspect-[4/3] w-full object-cover" loading="lazy" />
      <div className="space-y-2 p-3 text-sm">
        <input aria-label="Alt text (EN)" className="field" value={x.alt.en ?? ''} onChange={(e) => setX({ ...x, alt: { ...x.alt, en: e.target.value } })} />
        <input aria-label="Credit" placeholder="Credit" className="field" value={x.credit ?? ''} onChange={(e) => setX({ ...x, credit: e.target.value || null })} />
        <select aria-label="Permission" className="field" value={x.permission} onChange={(e) => setX({ ...x, permission: e.target.value as MediaPermission })}>{Object.entries(PERMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select aria-label="Location" className="field" value={x.locationId ?? ''} onChange={(e) => setX({ ...x, locationId: e.target.value || null })}><option value="">— No location —</option>{c.locations.map((l) => <option key={l.id} value={l.id}>{tr(l.name, 'en')}</option>)}</select>
        <div className="flex gap-2">
          <button className="btn btn-primary !py-2" onClick={() => onChange(x)}>Save</button>
          <ConfirmButton className="btn btn-ghost !py-2 text-primary" label={<Trash2 className="h-4 w-4" aria-label="Delete" />} title="Delete this image?" body="The file is removed from storage and from any location using it as a cover. This cannot be undone." onConfirm={onDelete} />
        </div>
      </div>
    </div>
  );
}

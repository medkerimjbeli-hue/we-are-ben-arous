import { useState } from 'react';
import { Save } from 'lucide-react';
import type { Delegation } from '../../../types';
import { useAdmin } from '../AdminApp';
import { saveDelegation } from '../api';
import { PageHeader, Toast } from '../ui';

export default function DelegationsPage() {
  const { catalog: c, reload } = useAdmin();
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);
  return (
    <div className="max-w-5xl">
      <PageHeader title="Delegations" />
      <p className="mb-4 text-sm text-muted">
        Identifiers, membership and boundaries come from the Map Tunisia dataset (INS codes) and cannot be edited here.
        You can adjust the public display labels; the source names are kept for reference.
      </p>
      <Toast message={msg?.text ?? null} kind={msg?.kind} />
      <div className="mt-4 space-y-3">
        {c.delegations.map((d) => <Row key={d.id} d={d} onSave={async (x) => {
          try { await saveDelegation(x); await reload(); setMsg({ text: `${x.name.en} saved.`, kind: 'ok' }); } catch (e) { setMsg({ text: (e as Error).message, kind: 'error' }); }
        }} />)}
      </div>
    </div>
  );
}

function Row({ d, onSave }: { d: Delegation; onSave: (d: Delegation) => void }) {
  const [x, setX] = useState(d);
  return (
    <div className="card p-4">
      <p className="mb-3 text-xs text-muted">{d.id} · INS {d.insCode} · {d.governorateId} · source: {d.sourceName.fr} / <span lang="ar">{d.sourceName.ar}</span></p>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        {(['en', 'fr', 'ar'] as const).map((l) => (
          <div key={l}><label className="label" htmlFor={`${l}-${d.id}`}>Label ({l.toUpperCase()})</label>
            <input id={`${l}-${d.id}`} lang={l} dir={l === 'ar' ? 'rtl' : 'ltr'} className="field" value={x.name[l] ?? ''} onChange={(e) => setX({ ...x, name: { ...x.name, [l]: e.target.value } })} /></div>
        ))}
        <button className="btn btn-primary" onClick={() => onSave(x)} disabled={!x.name.en?.trim() || !x.name.fr?.trim() || !x.name.ar?.trim()}><Save className="h-4 w-4" /> Save</button>
      </div>
    </div>
  );
}

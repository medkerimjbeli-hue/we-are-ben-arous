import { useState } from 'react';
import { Save } from 'lucide-react';
import type { Delegation } from '../../../types';
import { useAdmin } from '../AdminApp';
import { saveDelegation } from '../api';
import { PageHeader, Toast, useA, useErrorText, type Msg } from '../ui';
import { tr } from '../../../lib/localize';

export default function DelegationsPage() {
  const { catalog: c, reload } = useAdmin();
  const { a, lang } = useA();
  const errText = useErrorText();
  const [msg, setMsg] = useState<Msg>(null);
  return (
    <div className="max-w-5xl">
      <PageHeader title={a('delegations.title')} />
      <p className="mb-4 text-sm text-muted">{a('delegations.intro')}</p>
      <Toast message={msg?.text ?? null} kind={msg?.kind} />
      <div className="mt-4 space-y-3">
        {c.delegations.map((d) => <Row key={d.id} d={d} onSave={async (x) => {
          try { await saveDelegation(x); await reload(); setMsg({ text: a('delegations.saved', { name: tr(x.name, lang) }), kind: 'ok' }); } catch (e) { setMsg({ text: errText(e), kind: 'error' }); }
        }} />)}
      </div>
    </div>
  );
}

function Row({ d, onSave }: { d: Delegation; onSave: (d: Delegation) => void }) {
  const { a } = useA();
  const [x, setX] = useState(d);
  return (
    <div className="card p-4">
      <p className="mb-3 text-xs text-muted" dir="ltr">{d.id} · INS {d.insCode} · {d.governorateId} · {a('delegations.source')}: {d.sourceName.fr} / <span lang="ar">{d.sourceName.ar}</span></p>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        {(['en', 'fr', 'ar'] as const).map((l) => (
          <div key={l}><label className="label" htmlFor={`${l}-${d.id}`}>{a('delegations.label', { lang: a(`langs.${l}`) })}</label>
            <input id={`${l}-${d.id}`} lang={l} dir={l === 'ar' ? 'rtl' : 'ltr'} className="field" value={x.name[l] ?? ''} onChange={(e) => setX({ ...x, name: { ...x.name, [l]: e.target.value } })} /></div>
        ))}
        <button className="btn btn-primary" onClick={() => onSave(x)} disabled={!x.name.en?.trim() || !x.name.fr?.trim() || !x.name.ar?.trim()}><Save className="h-4 w-4" aria-hidden /> {a('common.save')}</button>
      </div>
    </div>
  );
}

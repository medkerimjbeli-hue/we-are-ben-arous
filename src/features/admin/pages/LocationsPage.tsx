import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, MapPin, Plus } from 'lucide-react';
import { useAdmin } from '../AdminApp';
import { PageHeader, Pager, StatusBadge, STATUS_LABEL } from '../ui';
import { locationIssues } from '../validation';
import { normalizeSearch, tr } from '../../../lib/localize';
import { STATUSES } from '../../../types';

const PAGE = 20;

export default function LocationsPage() {
  const { catalog: c } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const status = params.get('status') ?? '';
  const delegation = params.get('delegation') ?? '';
  const sort = params.get('sort') ?? 'updated';
  const set = (k: string, v: string) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }); setPage(1); };

  const rows = useMemo(() => {
    const nq = normalizeSearch(q);
    return c.locations
      .filter((l) => (!status || l.status === status) && (!delegation || l.delegationId === delegation))
      .filter((l) => !nq || Object.values(l.name).some((v) => v && normalizeSearch(v).includes(nq)))
      .sort((a, b) => sort === 'name' ? tr(a.name, 'en').localeCompare(tr(b.name, 'en')) : b.updatedAt.localeCompare(a.updatedAt));
  }, [c, q, status, delegation, sort]);
  const pages = Math.ceil(rows.length / PAGE);
  const view = rows.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div>
      <PageHeader title="Locations & stories"><Link to="/admin/locations/new" className="btn btn-primary"><Plus className="h-4 w-4" /> New</Link></PageHeader>
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-4">
        <div><label className="label" htmlFor="lq">Search</label><input id="lq" className="field" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <div><label className="label" htmlFor="ls">Status</label>
          <select id="ls" className="field" value={status} onChange={(e) => set('status', e.target.value)}><option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
        <div><label className="label" htmlFor="ld">Delegation</label>
          <select id="ld" className="field" value={delegation} onChange={(e) => set('delegation', e.target.value)}><option value="">All</option>{c.delegations.map((d) => <option key={d.id} value={d.id}>{tr(d.name, 'en')}</option>)}</select></div>
        <div><label className="label" htmlFor="lo">Sort</label>
          <select id="lo" className="field" value={sort} onChange={(e) => set('sort', e.target.value)}><option value="updated">Recently updated</option><option value="name">Name</option></select></div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-start text-xs uppercase text-muted"><tr className="border-b border-line">
            <th className="p-3 text-start">Name</th><th className="p-3 text-start">Delegation</th><th className="p-3 text-start">Status</th><th className="p-3 text-start">Pin</th><th className="p-3 text-start">Issues</th><th className="p-3 text-start">Updated</th>
          </tr></thead>
          <tbody>
            {view.map((l) => {
              const warn = locationIssues(l, c).length;
              return (
                <tr key={l.id} className="border-b border-line/60 hover:bg-white/5">
                  <td className="p-3"><Link to={`/admin/locations/${l.id}`} className="font-semibold hover:text-primary">{tr(l.name, 'en') || '(untitled)'}</Link>{l.kind === 'story' && <span className="chip ms-2">story</span>}</td>
                  <td className="p-3 text-muted">{tr(c.delegations.find((d) => d.id === l.delegationId)?.name, 'en')}</td>
                  <td className="p-3"><StatusBadge status={l.status} /></td>
                  <td className="p-3">{l.coordinateStatus === 'verified' ? <MapPin className="h-4 w-4 text-primary" aria-label="Verified" /> : <span className="text-muted">—</span>}</td>
                  <td className="p-3">{warn ? <span className="inline-flex items-center gap-1 text-amber-300"><AlertTriangle className="h-3.5 w-3.5" /> {warn}</span> : <span className="text-muted">0</span>}</td>
                  <td className="p-3 text-muted">{new Date(l.updatedAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
            {!view.length && <tr><td colSpan={6} className="p-6 text-center text-muted">No locations match.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} onPage={setPage} />
    </div>
  );
}

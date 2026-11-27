import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, MapPin, Plus } from 'lucide-react';
import { useAdmin } from '../AdminApp';
import { PageHeader, Pager, StatusBadge, useA } from '../ui';
import { locationIssues, type IssueTag } from '../validation';
import { normalizeSearch, tr } from '../../../lib/localize';
import { STATUSES } from '../../../types';

const PAGE = 20;
const TAGS: IssueTag[] = ['translations', 'description', 'coords', 'photo', 'credit', 'category'];

export default function LocationsPage() {
  const { catalog: c } = useAdmin();
  const { a, lang, fmtDate } = useA();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const status = params.get('status') ?? '';
  const delegation = params.get('delegation') ?? '';
  const kind = params.get('kind') ?? '';
  const issue = (params.get('issue') ?? '') as IssueTag | '';
  const sort = params.get('sort') ?? 'updated';
  const set = (k: string, v: string) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }); setPage(1); };

  const rows = useMemo(() => {
    const nq = normalizeSearch(q);
    return c.locations
      .filter((l) => (!status || l.status === status) && (!delegation || l.delegationId === delegation) && (!kind || l.kind === kind))
      .filter((l) => !issue || (l.status !== 'archived' && locationIssues(l, c).some((i) => i.tag === issue)))
      .filter((l) => !nq || Object.values(l.name).some((v) => v && normalizeSearch(v).includes(nq)))
      .sort((x, y) => sort === 'name' ? tr(x.name, lang).localeCompare(tr(y.name, lang), lang) : y.updatedAt.localeCompare(x.updatedAt));
  }, [c, q, status, delegation, kind, issue, sort, lang]);
  const pages = Math.ceil(rows.length / PAGE);
  const view = rows.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div>
      <PageHeader title={a('locations.title')}><Link to="/admin/locations/new" className="btn btn-primary"><Plus className="h-4 w-4" aria-hidden /> {a('common.new')}</Link></PageHeader>
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="lg:col-span-2"><label className="label" htmlFor="lq">{a('common.search')}</label><input id="lq" className="field" dir="auto" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <div><label className="label" htmlFor="ls">{a('common.status')}</label>
          <select id="ls" className="field" value={status} onChange={(e) => set('status', e.target.value)}><option value="">{a('common.all')}</option>{STATUSES.map((s) => <option key={s} value={s}>{a(`status.${s}`)}</option>)}</select></div>
        <div><label className="label" htmlFor="lk">{a('common.type')}</label>
          <select id="lk" className="field" value={kind} onChange={(e) => set('kind', e.target.value)}><option value="">{a('common.all')}</option><option value="place">{a('common.place')}</option><option value="story">{a('common.story')}</option></select></div>
        <div><label className="label" htmlFor="ld">{a('common.delegation')}</label>
          <select id="ld" className="field" value={delegation} onChange={(e) => set('delegation', e.target.value)}><option value="">{a('common.all')}</option>{c.delegations.map((d) => <option key={d.id} value={d.id}>{tr(d.name, lang)}</option>)}</select></div>
        <div><label className="label" htmlFor="li">{a('locations.filterIssue')}</label>
          <select id="li" className="field" value={issue} onChange={(e) => set('issue', e.target.value)}><option value="">{a('common.all')}</option>{TAGS.map((tg) => <option key={tg} value={tg}>{a(`dashboard.checks.${tg}`)}</option>)}</select></div>
        <div><label className="label" htmlFor="lo">{a('common.order')}</label>
          <select id="lo" className="field" value={sort} onChange={(e) => set('sort', e.target.value)}><option value="updated">{a('locations.sortUpdated')}</option><option value="name">{a('locations.sortName')}</option></select></div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted"><tr className="border-b border-line">
            {[a('common.name'), a('common.delegation'), a('common.status'), a('locations.pin'), a('common.issues'), a('common.updated')].map((h) => <th key={h} scope="col" className="p-3 text-start">{h}</th>)}
          </tr></thead>
          <tbody>
            {view.map((l) => {
              const warn = locationIssues(l, c).length;
              return (
                <tr key={l.id} className="border-b border-line/60 hover:bg-white/5">
                  <td className="p-3"><Link to={`/admin/locations/${l.id}`} className="font-semibold hover:text-primary" dir="auto">{tr(l.name, lang) || a('locations.untitled')}</Link>{l.kind === 'story' && <span className="chip ms-2">{a('common.story')}</span>}</td>
                  <td className="p-3 text-muted">{tr(c.delegations.find((d) => d.id === l.delegationId)?.name, lang)}</td>
                  <td className="p-3"><StatusBadge status={l.status} /></td>
                  <td className="p-3">{l.coordinateStatus === 'verified' ? <MapPin className="h-4 w-4 text-primary" aria-label={a('locations.verifiedPin')} /> : <span className="text-muted">—</span>}</td>
                  <td className="p-3">{warn ? <span className="inline-flex items-center gap-1 text-amber-300"><AlertTriangle className="h-3.5 w-3.5" aria-hidden /> {warn}</span> : <span className="text-muted">0</span>}</td>
                  <td className="p-3 text-muted">{fmtDate(l.updatedAt)}</td>
                </tr>
              );
            })}
            {!view.length && <tr><td colSpan={6} className="p-6 text-center text-muted">{a('common.noResults')}</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} onPage={setPage} />
    </div>
  );
}

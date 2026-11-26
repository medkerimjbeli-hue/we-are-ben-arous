import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, Plus, Star } from 'lucide-react';
import { useAdmin } from '../AdminApp';
import { PageHeader, Pager, StatusBadge } from '../ui';
import { postIssues } from '../validation';
import { tr } from '../../../lib/localize';
import { parseInstagramUrl } from '../../instagram/instagram';

const PAGE = 25;

export default function PostsPage() {
  const { catalog: c } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const unlinked = params.get('unlinked') === '1';
  const rows = useMemo(() => c.socialPosts
    .filter((p) => (!unlinked || !p.locationId) && (!q || p.label.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || (a.featuredRank ?? 9) - (b.featuredRank ?? 9) || a.sortOrder - b.sortOrder), [c, q, unlinked]);
  const view = rows.slice((page - 1) * PAGE, page * PAGE);
  return (
    <div>
      <PageHeader title="Instagram posts & Reels"><Link to="/admin/posts/new" className="btn btn-primary"><Plus className="h-4 w-4" /> Add URL</Link></PageHeader>
      <p className="mb-4 max-w-3xl text-sm text-muted">
        Posts are shown with Instagram’s official embed and always link to the original URL. Feature up to five posts for the homepage (positions 1–5).
        Without verified, comparable metrics, the homepage shows them as “Featured” — never as a ranking.
      </p>
      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="grow"><label className="label" htmlFor="pq">Search label</label><input id="pq" className="field" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" checked={unlinked} onChange={(e) => { setParams(e.target.checked ? { unlinked: '1' } : {}); setPage(1); }} /> Unlinked only</label>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted"><tr className="border-b border-line">
            <th className="p-3 text-start">Label</th><th className="p-3 text-start">Type</th><th className="p-3 text-start">Delegation</th><th className="p-3 text-start">Location</th><th className="p-3 text-start">Status</th><th className="p-3 text-start">Featured</th><th className="p-3 text-start">Issues</th>
          </tr></thead>
          <tbody>
            {view.map((p) => (
              <tr key={p.id} className="border-b border-line/60 hover:bg-white/5">
                <td className="p-3"><Link to={`/admin/posts/${p.id}`} className="font-semibold hover:text-primary">{p.label}</Link>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="ms-2 inline-block text-muted hover:text-white" aria-label="Open on Instagram"><ExternalLink className="h-3.5 w-3.5" /></a></td>
                <td className="p-3 text-muted">{parseInstagramUrl(p.url)?.type ?? '?'}</td>
                <td className="p-3 text-muted">{tr(c.delegations.find((d) => d.id === p.delegationId)?.name, 'en') || '—'}</td>
                <td className="p-3">{p.locationId ? tr(c.locations.find((l) => l.id === p.locationId)?.name, 'en') : <span className="text-amber-300">Unlinked</span>}</td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
                <td className="p-3">{p.featured ? <span className="inline-flex items-center gap-1 text-primary"><Star className="h-3.5 w-3.5 fill-current" /> #{p.featuredRank}</span> : '—'}</td>
                <td className="p-3 text-muted">{postIssues(p, c).length}</td>
              </tr>
            ))}
            {!view.length && <tr><td colSpan={7} className="p-6 text-center text-muted">No posts.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={Math.ceil(rows.length / PAGE)} onPage={setPage} />
    </div>
  );
}

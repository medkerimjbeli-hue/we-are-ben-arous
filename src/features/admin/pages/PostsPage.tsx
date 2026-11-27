import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, Plus, Star } from 'lucide-react';
import { useAdmin } from '../AdminApp';
import { PageHeader, Pager, StatusBadge, useA } from '../ui';
import { postIssues } from '../validation';
import { normalizeSearch, tr } from '../../../lib/localize';
import { parseInstagramUrl } from '../../instagram/instagram';

const PAGE = 25;

export default function PostsPage() {
  const { catalog: c } = useAdmin();
  const { a, lang } = useA();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const unlinked = params.get('unlinked') === '1';
  const rows = useMemo(() => c.socialPosts
    .filter((p) => (!unlinked || !p.locationId) && (!q || normalizeSearch(p.label).includes(normalizeSearch(q))))
    .sort((x, y) => Number(y.featured) - Number(x.featured) || (x.featuredRank ?? 9) - (y.featuredRank ?? 9) || x.sortOrder - y.sortOrder), [c, q, unlinked]);
  const view = rows.slice((page - 1) * PAGE, page * PAGE);
  return (
    <div>
      <PageHeader title={a('posts.title')}><Link to="/admin/posts/new" className="btn btn-primary"><Plus className="h-4 w-4" aria-hidden /> {a('posts.addUrl')}</Link></PageHeader>
      <p className="mb-4 max-w-3xl text-sm text-muted">{a('posts.intro')}</p>
      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="grow"><label className="label" htmlFor="pq">{a('common.search')}</label><input id="pq" className="field" dir="auto" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" checked={unlinked} onChange={(e) => { setParams(e.target.checked ? { unlinked: '1' } : {}); setPage(1); }} /> {a('posts.unlinkedOnly')}</label>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted"><tr className="border-b border-line">
            {[a('posts.label'), a('common.type'), a('common.delegation'), a('posts.location'), a('common.status'), a('posts.featured'), a('common.issues')].map((h) => <th key={h} scope="col" className="p-3 text-start">{h}</th>)}
          </tr></thead>
          <tbody>
            {view.map((p) => {
              const type = parseInstagramUrl(p.url)?.type;
              return (
                <tr key={p.id} className="border-b border-line/60 hover:bg-white/5">
                  <td className="p-3"><Link to={`/admin/posts/${p.id}`} className="font-semibold hover:text-primary" dir="auto">{p.label}</Link>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="ms-2 inline-block text-muted hover:text-white" aria-label={a('posts.openOnInstagram')}><ExternalLink className="h-3.5 w-3.5" aria-hidden /></a></td>
                  <td className="p-3 text-muted">{type ? a(`posts.types.${type}`) : '?'}</td>
                  <td className="p-3 text-muted">{tr(c.delegations.find((d) => d.id === p.delegationId)?.name, lang) || '—'}</td>
                  <td className="p-3">{p.locationId ? <span dir="auto">{tr(c.locations.find((l) => l.id === p.locationId)?.name, lang)}</span> : <span className="text-amber-300">{a('posts.unlinked')}</span>}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3">{p.featured ? <span className="inline-flex items-center gap-1 text-primary"><Star className="h-3.5 w-3.5 fill-current" aria-hidden /> #{p.featuredRank}</span> : '—'}</td>
                  <td className="p-3 text-muted">{postIssues(p, c).length}</td>
                </tr>
              );
            })}
            {!view.length && <tr><td colSpan={7} className="p-6 text-center text-muted">{a('posts.noPosts')}</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={Math.ceil(rows.length / PAGE)} onPage={setPage} />
    </div>
  );
}

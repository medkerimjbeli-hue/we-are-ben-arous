import { Link } from 'react-router-dom';
import { useAdmin } from '../AdminApp';
import { locationIssues, postIssues } from '../validation';
import { PageHeader } from '../ui';
import { tr } from '../../../lib/localize';
import { STATUSES } from '../../../types';

export default function DashboardPage() {
  const { catalog: c } = useAdmin();
  const count = (s: string) => c.locations.filter((l) => l.status === s).length;
  const locWarnings = c.locations.map((l) => ({ l, issues: locationIssues(l, c) })).filter((x) => x.issues.length);
  const postWarnings = c.socialPosts.map((p) => ({ p, issues: postIssues(p, c) })).filter((x) => x.issues.length);
  const stats = [
    { label: 'Locations & stories', value: c.locations.length, to: '/admin/locations' },
    { label: 'Published', value: count('published'), to: '/admin/locations?status=published' },
    { label: 'Needs review', value: count('needs_review'), to: '/admin/locations?status=needs_review' },
    { label: 'Instagram posts', value: c.socialPosts.length, to: '/admin/posts' },
    { label: 'Featured posts', value: c.socialPosts.filter((p) => p.featured).length, to: '/admin/posts' },
    { label: 'Unlinked posts', value: c.socialPosts.filter((p) => !p.locationId).length, to: '/admin/posts?unlinked=1' },
    { label: 'Verified pins', value: c.locations.filter((l) => l.coordinateStatus === 'verified').length, to: '/admin/locations' },
    { label: 'Media files', value: c.media.length, to: '/admin/media' },
  ];
  return (
    <div>
      <PageHeader title="Dashboard">
        <Link to="/admin/locations/new" className="btn btn-primary">New location</Link>
        <Link to="/admin/posts/new" className="btn btn-ghost">New Instagram post</Link>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="card p-5 hover:border-primary">
            <p className="font-display text-3xl font-extrabold">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Status breakdown: {STATUSES.map((s) => `${s.replace('_', ' ')} ${count(s)}`).join(' · ')}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Locations needing attention ({locWarnings.length})</h2>
          <ul className="divide-y divide-line">
            {locWarnings.slice(0, 15).map(({ l, issues }) => (
              <li key={l.id} className="py-3">
                <Link to={`/admin/locations/${l.id}`} className="font-semibold hover:text-primary">{tr(l.name, 'en') || '(untitled)'}</Link>
                <p className="text-xs text-muted">{issues.map((i) => i.message).join(' · ')}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Posts needing attention ({postWarnings.length})</h2>
          <ul className="divide-y divide-line">
            {postWarnings.slice(0, 15).map(({ p, issues }) => (
              <li key={p.id} className="py-3">
                <Link to={`/admin/posts/${p.id}`} className="font-semibold hover:text-primary">{p.label}</Link>
                <p className="text-xs text-muted">{issues.map((i) => i.message).join(' · ')}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAdmin } from '../AdminApp';
import { locationIssues, type IssueTag } from '../validation';
import { PageHeader, StatusBadge, useA } from '../ui';
import { tr } from '../../../lib/localize';

export default function DashboardPage() {
  const { catalog: c } = useAdmin();
  const { a, lang, fmtDate } = useA();
  const count = (s: string) => c.locations.filter((l) => l.status === s).length;
  const tagged = (tag: IssueTag) => c.locations.filter((l) => l.status !== 'archived' && locationIssues(l, c).some((i) => i.tag === tag)).length;
  const stats = [
    { label: a('dashboard.stats.locations'), value: c.locations.length, to: '/admin/locations' },
    { label: a('dashboard.stats.published'), value: count('published'), to: '/admin/locations?status=published' },
    { label: a('dashboard.stats.needsReview'), value: count('needs_review'), to: '/admin/locations?status=needs_review' },
    { label: a('dashboard.stats.posts'), value: c.socialPosts.length, to: '/admin/posts' },
    { label: a('dashboard.stats.featured'), value: c.socialPosts.filter((p) => p.featured).length, to: '/admin/posts' },
    { label: a('dashboard.stats.unlinked'), value: c.socialPosts.filter((p) => !p.locationId).length, to: '/admin/posts?unlinked=1' },
    { label: a('dashboard.stats.verifiedPins'), value: c.locations.filter((l) => l.coordinateStatus === 'verified').length, to: '/admin/locations' },
    { label: a('dashboard.stats.media'), value: c.media.length, to: '/admin/media' },
  ];
  const checks = [
    { label: a('dashboard.checks.review'), n: count('needs_review') + c.socialPosts.filter((p) => p.status === 'needs_review').length, to: '/admin/locations?status=needs_review' },
    { label: a('dashboard.checks.drafts'), n: count('draft'), to: '/admin/locations?status=draft' },
    { label: a('dashboard.checks.translations'), n: tagged('translations'), to: '/admin/locations?issue=translations' },
    { label: a('dashboard.checks.description'), n: tagged('description'), to: '/admin/locations?issue=description' },
    { label: a('dashboard.checks.coords'), n: tagged('coords'), to: '/admin/locations?issue=coords' },
    { label: a('dashboard.checks.photo'), n: tagged('photo'), to: '/admin/locations?issue=photo' },
    { label: a('dashboard.checks.credit'), n: tagged('credit') + c.media.filter((m) => !m.credit || m.permission === 'unknown').length, to: '/admin/locations?issue=credit' },
    { label: a('dashboard.checks.category'), n: tagged('category'), to: '/admin/locations?issue=category' },
    { label: a('dashboard.checks.unlinked'), n: c.socialPosts.filter((p) => !p.locationId).length, to: '/admin/posts?unlinked=1' },
  ];
  const open = checks.filter((x) => x.n > 0);
  const recent = [...c.locations].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)).slice(0, 6);
  return (
    <div>
      <PageHeader title={a('dashboard.title')}>
        <Link to="/admin/locations/new" className="btn btn-primary">{a('dashboard.newLocation')}</Link>
        <Link to="/admin/posts/new" className="btn btn-ghost">{a('dashboard.newPost')}</Link>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="card p-5 hover:border-primary">
            <p className="font-display text-3xl font-extrabold">{s.value.toLocaleString(lang === 'ar' ? 'ar-TN' : lang)}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-5" aria-labelledby="todo">
          <h2 id="todo" className="font-display text-lg font-bold">{a('dashboard.todo')}</h2>
          <p className="mb-4 text-sm text-muted">{a('dashboard.todoLead')}</p>
          {open.length ? (
            <ul className="divide-y divide-line">
              {open.map((x) => (
                <li key={x.label}>
                  <Link to={x.to} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
                    <span>{x.label}</span>
                    <span className="flex items-center gap-2"><span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-sm font-bold text-amber-300">{x.n}</span><ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-5 w-5" aria-hidden /> {a('dashboard.allGood')}</p>}
        </section>
        <section className="card p-5" aria-labelledby="recent">
          <h2 id="recent" className="mb-4 font-display text-lg font-bold">{a('dashboard.recent')}</h2>
          <ul className="divide-y divide-line">
            {recent.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <Link to={`/admin/locations/${l.id}`} className="block truncate font-semibold hover:text-primary" dir="auto">{tr(l.name, lang) || a('locations.untitled')}</Link>
                  <span className="text-xs text-muted">{fmtDate(l.updatedAt)}</span>
                </span>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

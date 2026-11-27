import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Revision } from '../../../types';
import { useAdmin } from '../AdminApp';
import { loadRevisions } from '../api';
import { PageHeader, useA, useErrorText } from '../ui';
import { Loading } from '../../../components/States';

const LINK: Record<string, string> = { locations: '/admin/locations/', social_posts: '/admin/posts/' };

export default function HistoryPage() {
  const { session } = useAdmin();
  const { a, fmtDate } = useA();
  const errText = useErrorText();
  const [rows, setRows] = useState<Revision[] | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { loadRevisions(undefined, 150).then(setRows).catch((e) => setError(errText(e))); }, [errText]);

  const label = (r: Revision) => {
    const s = r.snapshot as { name?: Record<string, string>; label?: string; slug?: string; path?: string };
    return s.label ?? s.name?.en ?? s.name?.fr ?? s.name?.ar ?? s.slug ?? s.path ?? r.recordId;
  };
  return (
    <div className="max-w-4xl">
      <PageHeader title={a('history.title')} />
      <p className="mb-4 text-sm text-muted">{a('history.lead')}</p>
      {error ? <p role="alert" className="text-primary">{error}</p> : rows === undefined ? <Loading /> : rows === null ? <p className="text-muted">{a('history.unavailable')}</p> : rows.length === 0 ? <p className="text-muted">{a('history.empty')}</p> : (
        <ol className="card divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <span>
                <span className="font-semibold">{a(`history.actions.${r.action}`)}</span> · <span className="text-muted">{a(`history.tables.${r.tableName}`)}</span> ·{' '}
                {LINK[r.tableName] && r.action !== 'DELETE' ? <Link className="underline" dir="auto" to={LINK[r.tableName] + r.recordId}>{label(r)}</Link> : <span dir="auto">{label(r)}</span>}
              </span>
              <span className="text-xs text-muted">{fmtDate(r.changedAt)} · {a('history.by', { who: r.changedBy === session.user.id ? a('history.you') : a('history.someone') })}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

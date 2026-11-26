import { useState, type ReactNode } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import type { ContentStatus, Lang, Localized } from '../../types';
import { Dialog } from '../../components/Dialog';
import type { Issue } from './validation';

export const STATUS_LABEL: Record<ContentStatus, string> = { draft: 'Draft', needs_review: 'Needs review', published: 'Published', archived: 'Archived' };
const STATUS_CLS: Record<ContentStatus, string> = {
  draft: 'border-line text-muted', needs_review: 'border-amber-500/60 text-amber-300', published: 'border-emerald-500/60 text-emerald-300', archived: 'border-line text-muted line-through',
};
export function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`chip ${STATUS_CLS[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const LANG_LABEL: Record<Lang, string> = { en: 'English', fr: 'Français', ar: 'العربية' };

/** One field edited in English, French and Arabic, with missing-translation markers. */
export function LocalizedField({ label, value, onChange, multiline = false, rows = 6, id }: { label: string; value: Localized; onChange: (v: Localized) => void; multiline?: boolean; rows?: number; id: string }) {
  const [tab, setTab] = useState<Lang>('en');
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div role="tablist" className="mb-2 flex gap-1">
        {(['en', 'fr', 'ar'] as Lang[]).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={tab === l} onClick={() => setTab(l)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === l ? 'bg-white text-ink' : 'border border-line text-muted'}`}>
            {LANG_LABEL[l]}{!value[l]?.trim() && <span className="ms-1 text-primary" title="Missing translation">•</span>}
          </button>
        ))}
      </div>
      {(['en', 'fr', 'ar'] as Lang[]).map((l) => {
        const props = { id: `${id}-${l}`, 'aria-label': `${label} (${LANG_LABEL[l]})`, lang: l, dir: l === 'ar' ? 'rtl' : 'ltr', value: value[l] ?? '', className: 'field', hidden: tab !== l,
          onChange: (e: { target: { value: string } }) => onChange({ ...value, [l]: e.target.value }) } as const;
        return multiline ? <textarea key={l} rows={rows} {...props} /> : <input key={l} {...props} />;
      })}
    </fieldset>
  );
}

export function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  return (
    <ul className="space-y-1.5" aria-label="Validation">
      {issues.map((i, k) => (
        <li key={k} className={`flex items-start gap-2 text-sm ${i.level === 'error' ? 'text-primary' : 'text-amber-300'}`}>
          {i.level === 'error' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
          <span><span className="sr-only">{i.level}: </span>{i.message}</span>
        </li>
      ))}
    </ul>
  );
}

/** Button that asks for confirmation before running a destructive action. */
export function ConfirmButton({ label, title, body, onConfirm, className = 'btn btn-ghost text-primary' }: { label: ReactNode; title: string; body: string; onConfirm: () => Promise<void> | void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} title={title}>
        <p className="text-muted">{body}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" disabled={busy} className="btn btn-primary" onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); setOpen(false); } }}>{busy ? 'Working…' : 'Confirm'}</button>
          <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </Dialog>
    </>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center gap-2 text-sm">
      <button className="btn btn-ghost !py-1.5" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="text-muted">Page {page} of {pages}</span>
      <button className="btn btn-ghost !py-1.5" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </nav>
  );
}

export function Toast({ message, kind = 'ok' }: { message: string | null; kind?: 'ok' | 'error' }) {
  if (!message) return null;
  return <p role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${kind === 'error' ? 'border-primary/60 text-primary' : 'border-emerald-500/50 text-emerald-300'}`}>{message}</p>;
}

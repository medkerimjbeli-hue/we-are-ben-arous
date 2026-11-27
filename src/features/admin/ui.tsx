import { useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, XCircle } from 'lucide-react';
import type { ContentStatus, Lang, Localized } from '../../types';
import { Dialog } from '../../components/Dialog';
import type { Issue } from './validation';
import { AdminError } from './api';

/** Shorthand for admin translations. */
export function useA() {
  const { t, i18n } = useTranslation();
  const a = useCallback((key: string, opts?: Record<string, unknown>) => String(t(`admin.${key}`, opts as never)), [t]);
  const lang = (i18n.language as Lang) ?? 'en';
  const fmtDate = useCallback((iso: string) => new Date(iso).toLocaleString(lang === 'ar' ? 'ar-TN' : lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }), [lang]);
  return { a, lang, fmtDate };
}

/** Turns any thrown error into a translated, user-facing message. */
export function useErrorText() {
  const { a } = useA();
  return useCallback((e: unknown) => {
    const err = e as Error;
    if (e instanceof AdminError && e.key) return a(e.key, { message: err.message });
    return a('errors.generic', { message: err?.message ?? String(e) });
  }, [a]);
}

const STATUS_CLS: Record<ContentStatus, string> = {
  draft: 'border-line text-muted', needs_review: 'border-amber-500/60 text-amber-300', published: 'border-emerald-500/60 text-emerald-300', archived: 'border-line text-muted line-through',
};
export function StatusBadge({ status }: { status: ContentStatus }) {
  const { a } = useA();
  return <span className={`chip ${STATUS_CLS[status]}`}>{a(`status.${status}`)}</span>;
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-extrabold sm:text-3xl" dir="auto">{title}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Section({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 ${className}`}>
      {title && <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>}
      {children}
    </section>
  );
}

/** One field edited in English, French and Arabic, with missing-translation markers. */
export function LocalizedField({ label, value, onChange, multiline = false, rows = 6, id, hint }: { label: string; value: Localized; onChange: (v: Localized) => void; multiline?: boolean; rows?: number; id: string; hint?: string }) {
  const { a } = useA();
  const [tab, setTab] = useState<Lang>('en');
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div role="tablist" aria-label={label} className="mb-2 flex gap-1">
        {(['en', 'fr', 'ar'] as Lang[]).map((l) => (
          <button key={l} type="button" role="tab" id={`${id}-tab-${l}`} aria-controls={`${id}-${l}`} aria-selected={tab === l} onClick={() => setTab(l)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === l ? 'bg-white text-ink' : 'border border-line text-muted'}`}>
            <span lang={l}>{a(`langs.${l}`)}</span>{!value[l]?.trim() && <span className="ms-1 text-primary" title={a('common.missingTranslation')} aria-label={a('common.missingTranslation')}>•</span>}
          </button>
        ))}
      </div>
      {(['en', 'fr', 'ar'] as Lang[]).map((l) => {
        const props = {
          id: `${id}-${l}`, role: 'tabpanel', 'aria-labelledby': `${id}-tab-${l}`, lang: l, dir: l === 'ar' ? 'rtl' : 'ltr', value: value[l] ?? '', className: 'field', hidden: tab !== l,
          onChange: (e: { target: { value: string } }) => onChange({ ...value, [l]: e.target.value }),
        } as const;
        return multiline ? <textarea key={l} rows={rows} {...props} /> : <input key={l} {...props} />;
      })}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </fieldset>
  );
}

export function IssueList({ issues }: { issues: Issue[] }) {
  const { a } = useA();
  if (!issues.length) return <p className="text-sm text-emerald-300">{a('common.noIssues')}</p>;
  return (
    <ul className="space-y-1.5" aria-label={a('common.validation')}>
      {issues.map((i, k) => (
        <li key={k} className={`flex items-start gap-2 text-sm ${i.level === 'error' ? 'text-primary' : 'text-amber-300'}`}>
          {i.level === 'error' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
          <span><span className="sr-only">{a(i.level === 'error' ? 'common.error' : 'common.warning')}: </span>{a(`issues.${i.code}`, i.params)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Button that asks for confirmation before running a destructive action. */
export function ConfirmButton({ label, title, body, onConfirm, className = 'btn btn-ghost text-primary', ariaLabel }: { label: ReactNode; title: string; body: string; onConfirm: () => Promise<void> | void; className?: string; ariaLabel?: string }) {
  const { a } = useA();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className={className} aria-label={ariaLabel} onClick={() => setOpen(true)}>{label}</button>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} title={title}>
        <p className="text-muted">{body}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" disabled={busy} className="btn btn-primary" onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); setOpen(false); } }}>{busy ? a('common.working') : a('common.confirm')}</button>
          <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => setOpen(false)}>{a('common.cancel')}</button>
        </div>
      </Dialog>
    </>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const { a } = useA();
  if (pages <= 1) return null;
  return (
    <nav aria-label={a('common.pageOf', { page, pages })} className="mt-4 flex items-center gap-2 text-sm">
      <button className="btn btn-ghost !py-1.5" disabled={page <= 1} onClick={() => onPage(page - 1)}>{a('common.previous')}</button>
      <span className="text-muted">{a('common.pageOf', { page, pages })}</span>
      <button className="btn btn-ghost !py-1.5" disabled={page >= pages} onClick={() => onPage(page + 1)}>{a('common.next')}</button>
    </nav>
  );
}

export function Toast({ message, kind = 'ok' }: { message: string | null; kind?: 'ok' | 'error' }) {
  if (!message) return null;
  return <p role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${kind === 'error' ? 'border-primary/60 text-primary' : 'border-emerald-500/50 text-emerald-300'}`}>{message}</p>;
}

export type Msg = { text: string; kind: 'ok' | 'error' } | null;

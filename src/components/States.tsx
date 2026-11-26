import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function Loading({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex min-h-[40vh] items-center justify-center gap-3 text-muted">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden /> {label ?? t('common.loading')}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="mx-auto my-16 max-w-md card p-8 text-center">
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden />
      <h2 className="text-xl font-bold">{t('common.errorTitle')}</h2>
      <p className="mt-2 text-muted">{message ?? t('common.errorBody')}</p>
      {onRetry && <button className="btn btn-primary mt-6" onClick={onRetry}>{t('common.retry')}</button>}
    </div>
  );
}

export function Empty({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">
      {icon && <div className="mb-3 flex justify-center text-primary">{icon}</div>}
      {children}
    </div>
  );
}

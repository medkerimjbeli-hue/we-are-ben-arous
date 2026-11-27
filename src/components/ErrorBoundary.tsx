import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import i18n from '../features/i18n/i18n';

interface Props { children: ReactNode; resetKey?: string }
interface State { error: Error | null }

/**
 * Catches render errors (including failed lazy-loaded chunks after a redeploy) so one broken
 * section never blanks the whole site. Resets when `resetKey` (e.g. the route) changes.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info.componentStack); }
  componentDidUpdate(prev: Props) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    const t = i18n.t.bind(i18n);
    return (
      <div role="alert" className="mx-auto my-16 max-w-md card p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden />
        <h2 className="text-xl font-bold">{t('boundary.title')}</h2>
        <p className="mt-2 text-muted">{t('boundary.body')}</p>
        <button type="button" className="btn btn-primary mt-6" onClick={() => window.location.reload()}>{t('boundary.reload')}</button>
      </div>
    );
  }
}

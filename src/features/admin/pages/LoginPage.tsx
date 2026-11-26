import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Shell } from '../AdminApp';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
  };
  const reset = async () => {
    if (!email) { setError('Enter your email first.'); return; }
    setBusy(true); setError(null);
    const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}admin` });
    setBusy(false);
    if (error) setError(error.message); else setResetSent(true);
  };

  return (
    <Shell>
      <h1 className="text-2xl font-bold">Administrator sign-in</h1>
      <p className="mt-1 text-sm text-muted">Only authorised administrators can manage content.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="em" className="label">Email</label><input id="em" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" /></div>
        <div><label htmlFor="pw" className="label">Password</label><input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" /></div>
        {error && <p role="alert" className="text-sm text-primary">{error}</p>}
        {resetSent && <p role="status" className="text-sm text-muted">If this account exists, a password-reset email has been sent.</p>}
        <button disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" onClick={reset} disabled={busy} className="w-full text-center text-sm text-muted underline">Forgot password?</button>
      </form>
      <Link to="/" className="mt-6 block text-center text-sm text-muted hover:text-white">← Back to site</Link>
    </Shell>
  );
}

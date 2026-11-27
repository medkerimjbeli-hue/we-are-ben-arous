import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Shell } from '../AdminApp';
import { useA } from '../ui';

export default function LoginPage() {
  const { a } = useA();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const friendly = (msg: string) => /invalid login|invalid credentials/i.test(msg) ? a('auth.invalid') : /fetch|network/i.test(msg) ? a('auth.network') : msg;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) setError(friendly(error.message));
    } catch (err) { setError(friendly((err as Error).message)); }
    finally { setBusy(false); }
  };
  const reset = async () => {
    if (!email) { setError(a('auth.enterEmail')); return; }
    setBusy(true); setError(null);
    const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}admin` });
    setBusy(false);
    if (error) setError(friendly(error.message)); else setResetSent(true);
  };

  return (
    <Shell>
      <h1 className="text-2xl font-bold">{a('auth.signInTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{a('auth.signInLead')}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="em" className="label">{a('auth.email')}</label><input id="em" type="email" dir="ltr" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" /></div>
        <div><label htmlFor="pw" className="label">{a('auth.password')}</label><input id="pw" type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" /></div>
        {error && <p role="alert" className="text-sm text-primary">{error}</p>}
        {resetSent && <p role="status" className="text-sm text-muted">{a('auth.resetSent')}</p>}
        <button disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-50">{busy ? a('auth.signingIn') : a('auth.signIn')}</button>
        <button type="button" onClick={reset} disabled={busy} className="w-full text-center text-sm text-muted underline">{a('auth.forgot')}</button>
      </form>
      <Link to="/" className="mt-6 block text-center text-sm text-muted hover:text-white">{a('auth.backToSite')}</Link>
    </Shell>
  );
}

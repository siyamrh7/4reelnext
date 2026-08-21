'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Login failed');
        setBusy(false);
        return;
      }
      const next = params.get('next') || '/admin';
      router.push(next);
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <div className="a-login-wrap">
      <div className="a-login-card">
        <div className="a-brand">
          <span className="dot"></span>
          <span className="text">4REEL.AGENCY</span>
        </div>
        <h1>Admin panel</h1>
        <p>Log in met het admin-wachtwoord.</p>
        {error && <div className="a-login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="a-field">
            <label htmlFor="password">Wachtwoord</label>
            <input
              id="password"
              type="password"
              className="a-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button type="submit" className="a-btn primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Bezig…' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

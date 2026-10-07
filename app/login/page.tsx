'use client';
import { useState } from 'react';
import { APP_BYLINE, APP_LOGO, APP_NAME } from '@/lib/appbrand';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(j.error || 'Could not log in.');
    window.location.href = '/';
  }

  return (
    <div className="login">
      <form className="card stack" onSubmit={submit}>
        <div className="row">
          <img src={APP_LOGO} alt="" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <h2 style={{ margin: 0 }}>{APP_NAME}</h2>
            <div className="muted" style={{ fontSize: 13 }}>{APP_BYLINE}</div>
          </div>
        </div>
        <label className="f">
          Password
          <input className="in" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </label>
        {error && <div className="err">{error}</div>}
        <button className="btn amber" disabled={busy || !password}>
          {busy ? 'Opening…' : 'Open my brain'}
        </button>
      </form>
    </div>
  );
}

'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { PlanRow } from '@/lib/planner';

type Acc = { configured: boolean; connected: boolean; name: string; expiresAt: string };
type Data = { today: string; rows: PlanRow[]; linkedin: Acc; instagram: Acc };

const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

function Cell({ p, label }: { p?: any; label: string }) {
  if (!p) return <span className="muted">-</span>;
  const tone = p.status === 'posted' ? 'ok' : p.status === 'failed' ? 'bad' : '';
  return (
    <div>
      <span className={`pill ${tone}`}>{p.status === 'posted' ? 'Posted' : p.status === 'failed' ? 'Failed' : 'Scheduled'}</span>
      {p.url && <> <a href={p.url} target="_blank" style={{ fontSize: 12 }}>open {label}</a></>}
      {p.error && <div className="muted" style={{ fontSize: 11, maxWidth: 260 }}>{p.error}</div>}
    </div>
  );
}

function csv(rows: PlanRow[]) {
  const q = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Date', 'Title', 'Type', 'LinkedIn status', 'LinkedIn link', 'Instagram status', 'Instagram link', 'LinkedIn text', 'Instagram caption'];
  const lines = rows.map((r) => [r.date, r.title, r.kind, r.linkedin?.status || '', r.linkedin?.url || '', r.instagram?.status || '', r.instagram?.url || '', r.linkedin?.text || '', r.instagram?.caption || ''].map(q).join(','));
  return [head.map(q).join(','), ...lines].join('\n');
}

function Account({ name, a, onDisconnect }: { name: 'LinkedIn' | 'Instagram'; a: Acc; onDisconnect: () => void }) {
  const path = name === 'LinkedIn' ? 'linkedin' : 'instagram';
  const days = a.expiresAt ? Math.round((+new Date(a.expiresAt) - Date.now()) / 864e5) : 0;
  return (
    <div className="card" style={{ flex: 1, minWidth: 260 }}>
      <h3 style={{ marginTop: 0 }}>{name}</h3>
      {a.connected ? (
        <>
          <p style={{ margin: '0 0 8px' }}><span className="pill ok">Connected</span> {a.name}</p>
          <p className="muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
            {name === 'LinkedIn' ? `Connection lasts ${days} more days. Press Reconnect before then.` : 'Renews itself every week.'}
          </p>
          <div className="row">
            <a className="btn small ghost" href={`/api/${path}/connect`}>Reconnect</a>
            <button className="btn small ghost" onClick={onDisconnect}>Disconnect</button>
          </div>
        </>
      ) : (
        <>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 10px' }}>
            {a.configured ? 'Not connected yet.' : `First add the ${name} app keys in Vercel (see the setup steps).`}
          </p>
          <a className="btn small" href={`/api/${path}/connect`}>Connect {name}</a>
        </>
      )}
    </div>
  );
}

function Planner() {
  const sp = useSearchParams();
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState(sp.get('error') || '');
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  const load = useCallback(() => fetch('/api/planner').then((r) => r.json()).then(setData), []);
  useEffect(() => { load(); }, [load]);

  async function act(body: object, label: string) {
    setErr('');
    setBusy(label);
    try {
      const res = await fetch('/api/planner', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      await load();
    } catch (e: any) {
      setErr(e.message || 'Something went wrong.');
    } finally {
      setBusy('');
    }
  }

  async function disconnect(p: string) {
    await fetch(`/api/${p}/disconnect`, { method: 'POST' });
    load();
  }

  function downloadSheet() {
    if (!data) return;
    const blob = new Blob([csv(data.rows)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `content-planner-${data.today}.csv`;
    a.click();
  }

  if (!data) return <span className="spinner" />;
  const done = (r: PlanRow) => [r.linkedin, r.instagram].every((p) => !p || p.status === 'posted');
  const rows = data.rows.filter((r) => (view === 'upcoming' ? !done(r) : done(r)));
  if (view === 'past') rows.reverse();
  const month = data.rows.filter((r) => r.date.slice(0, 7) === data.today.slice(0, 7));

  return (
    <div>
      <h1>Planner</h1>
      <p className="sub">Your approved posts, by date. Scheduled posts go out by themselves at about 9 AM India time.</p>

      {sp.get('connected') && <div className="note" style={{ marginBottom: 12 }}>{sp.get('connected') === 'instagram' ? 'Instagram' : 'LinkedIn'} is connected.</div>}
      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}

      <div className="row" style={{ alignItems: 'stretch', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <Account name="LinkedIn" a={data.linkedin} onDisconnect={() => disconnect('linkedin')} />
        <Account name="Instagram" a={data.instagram} onDisconnect={() => disconnect('instagram')} />
        <div className="card" style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ marginTop: 0 }}>This month</h3>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{month.filter(done).length} / {month.length}</p>
          <p className="muted" style={{ fontSize: 12 }}>posts published</p>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap' }}>
          <div className="row">
            <button className={`btn small ${view === 'upcoming' ? '' : 'ghost'}`} onClick={() => setView('upcoming')}>Upcoming</button>
            <button className={`btn small ${view === 'past' ? '' : 'ghost'}`} onClick={() => setView('past')}>Posted</button>
          </div>
          <div className="row">
            {busy && <span className="row muted" style={{ fontSize: 13 }}><span className="spinner" /> {busy}</span>}
            <button className="btn small ghost" onClick={downloadSheet}>Download sheet (CSV)</button>
          </div>
        </div>
        {!rows.length && (
          <p className="muted">
            {view === 'upcoming' ? <>Nothing scheduled. Make a post in the <Link href="/">Studio</Link>, then press <b>Approve &amp; schedule</b>.</> : 'Nothing posted yet.'}
          </p>
        )}
        {!!rows.length && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: 8 }}>Date</th><th style={{ padding: 8 }}>Post</th><th style={{ padding: 8 }}>LinkedIn</th><th style={{ padding: 8 }}>Instagram</th><th style={{ padding: 8 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                    <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                      {done(r) ? fmt(r.date) : (
                        <input className="in" type="date" value={r.date} style={{ width: 150, padding: '4px 6px' }}
                          onChange={(e) => act({ action: 'date', id: r.id, date: e.target.value }, 'Moving…')} />
                      )}
                      {r.date < data.today && !done(r) && <div className="muted" style={{ fontSize: 11 }}>overdue</div>}
                    </td>
                    <td style={{ padding: 8 }}>
                      <span className="cmd-label" style={{ fontSize: 10 }}>{r.kind.toUpperCase()}</span>{' '}
                      <Link href={`/view/${r.outputId}`}>{r.title}</Link>
                    </td>
                    <td style={{ padding: 8 }}><Cell p={r.linkedin} label="post" /></td>
                    <td style={{ padding: 8 }}><Cell p={r.instagram} label="post" /></td>
                    <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                      {!done(r) && <button className="btn small" disabled={!!busy} onClick={() => act({ action: 'run', id: r.id }, 'Posting… (up to a minute)')}>Post now</button>}{' '}
                      {!done(r) && <button className="btn small ghost" disabled={!!busy} onClick={() => confirm('Remove this post from the Planner?') && act({ action: 'remove', id: r.id }, 'Removing…')}>Remove</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<span className="spinner" />}>
      <Planner />
    </Suspense>
  );
}

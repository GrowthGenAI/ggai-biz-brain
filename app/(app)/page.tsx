'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import OutputView from '@/components/OutputView';
import { COMMANDS, detectKind } from '@/lib/commands';
import { EMPTY_BRAND, type BrandKit, type Output } from '@/lib/types';

type Status = { notes: number; brandReadiness: number; brandName: string; openai: boolean; storage: string };

export default function Studio() {
  const [input, setInput] = useState('');
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [brand, setBrand] = useState<BrandKit>(EMPTY_BRAND);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [menuIndex, setMenuIndex] = useState(0);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/brand').then((r) => r.json()).then(setBrand).catch(() => {});
    fetch('/api/status').then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  const { kind, command } = detectKind(input);
  const typingCommand = /^\/\S*$/.test(input.trim()) && !input.includes(' ');
  const matches = useMemo(() => {
    const q = input.trim().toLowerCase();
    return COMMANDS.filter((c) => c.cmd.startsWith(q) || c.aliases.some((a) => a.startsWith(q)));
  }, [input]);
  const showMenu = typingCommand && matches.length > 0 && !COMMANDS.some((c) => c.cmd === input.trim());

  function pick(cmd: string) {
    setInput(cmd + ' ');
    box.current?.focus();
  }

  async function run() {
    if (!input.trim() || busy) return;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Something went wrong.');
      setOutputs((o) => [j, ...o]);
      setInput('');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (showMenu) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMenuIndex((i) => (i + 1) % matches.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMenuIndex((i) => (i - 1 + matches.length) % matches.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(matches[menuIndex].cmd); return; }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run();
  }

  const label = kind === 'answer' ? (input.trim() && !input.trim().startsWith('/') ? 'ASK YOUR BRAIN' : 'TYPE / FOR COMMANDS') : (COMMANDS.find((c) => c.cmd === command) || COMMANDS.find((c) => c.kind === kind))!.label.toUpperCase();
  const who = brand.founderName ? brand.founderName.split(' ')[0] : '';

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div>
        <h1>{who ? `Hi ${who}, what shall we make?` : 'What shall we make today?'}</h1>
        <p className="sub">Type <span className="kbd">/</span> to choose a format, or ask your brain anything.</p>
        {status && (
          <div className="row">
            <Link href="/brain" className={`pill ${status.notes ? 'ok' : 'warn'}`}>{status.notes ? `${status.notes} notes in your brain` : 'Upload your vault →'}</Link>
            <Link href="/brand" className={`pill ${status.brandReadiness >= 80 ? 'ok' : 'warn'}`}>Brand Kit {status.brandReadiness}%</Link>
            {!status.openai && <span className="pill bad">OpenAI key missing</span>}
            {status.storage === 'local' && <span className="pill">Local test mode</span>}
          </div>
        )}
      </div>

      <div className="composer">
        <textarea
          ref={box}
          className="in"
          placeholder={'/carousel why referrals are not a pipeline, 7 slides\nIntent: Educating\nSource: brand-messaging, icp'}
          value={input}
          onChange={(e) => { setInput(e.target.value); setMenuIndex(0); }}
          onKeyDown={onKey}
        />
        {showMenu && (
          <div className="menu">
            {matches.map((c, i) => (
              <button key={c.cmd} className={i === menuIndex ? 'on' : ''} onMouseDown={(e) => { e.preventDefault(); pick(c.cmd); }}>
                <b>{c.cmd}</b>
                <span className="muted">{c.hint}</span>
              </button>
            ))}
          </div>
        )}
        <div className="bar">
          <div className="row">
            <span className="cmd-label">{label}</span>
            <span className="muted" style={{ fontSize: 13 }}>Ctrl/Cmd + Enter to create</span>
          </div>
          <button className="btn amber" onClick={run} disabled={busy || !input.trim()}>
            {busy ? <><span className="spinner" /> Writing…</> : 'Create'}
          </button>
        </div>
        {!input && (
          <div className="chips" style={{ marginTop: 12 }}>
            {COMMANDS.map((c) => (
              <button key={c.cmd} onClick={() => pick(c.cmd)}>{c.cmd}</button>
            ))}
          </div>
        )}
      </div>

      {err && <div className="err">{err}</div>}

      {outputs.map((o) => (
        <OutputView key={o.id} out={o} brand={brand} autoDraw />
      ))}

      {!outputs.length && (
        <div className="note">
          Paste a prompt from your <b>content-prompts.html</b> or your <b>30-day calendar</b>. Everything you make is saved in <Link href="/history">History</Link>.
        </div>
      )}
    </div>
  );
}

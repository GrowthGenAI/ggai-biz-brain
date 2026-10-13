'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import OutputView from '@/components/OutputView';
import { EMPTY_BRAND, type BrandKit, type Output } from '@/lib/types';

type Lane = 'strategist' | 'research' | 'content' | 'brain';
type Route = { lane: Lane; command: string; reason: string };

function md(t: string) {
  const esc = String(t || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
  return esc.replace(/^#{1,3}\s*(.+)$/gm, '<b>$1</b>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

const FORMATS = [
  { cmd: '/text', label: 'Text post', icon: '¶' },
  { cmd: '/image', label: 'Image', icon: '▣' },
  { cmd: '/carousel', label: 'Carousel', icon: '❐' },
  { cmd: '/leadmagnet', label: 'Lead magnet', icon: '◈' },
  { cmd: '/reel', label: 'Reel', icon: '▶' },
  { cmd: '/video', label: 'Long video', icon: '◉' },
  { cmd: '/newsletter', label: 'Newsletter', icon: '✉' },
];

const TEAM: Record<string, { title: string; sub: string; about: string }> = {
  chief: { title: 'Chief', sub: 'Reads every note', about: 'Your chief reads your whole brain and hands each job to the right person. Give it one instruction.' },
  strategist: { title: 'Strategist', sub: 'Marketing decisions', about: 'Your CMO: positioning, offers, funnels and what to post next, built from your own notes.' },
  research: { title: 'Research', sub: 'Angles & ideas', about: 'Finds angles, hooks, objections and gaps from your notes. It does not browse the internet.' },
  content: { title: 'Content', sub: 'Posts in your voice', about: 'Writes every format in your voice and your Brand Kit colours.' },
};

export default function CommandCentre() {
  const [brand, setBrand] = useState<BrandKit>(EMPTY_BRAND);
  const [input, setInput] = useState('');
  const [route, setRoute] = useState<Route | null>(null);
  const [stage, setStage] = useState<'idle' | 'routing' | 'working' | 'done'>('idle');
  const [out, setOut] = useState<Output | null>(null);
  const [err, setErr] = useState('');
  const [focus, setFocus] = useState<keyof typeof TEAM>('chief');
  const [listening, setListening] = useState(false);
  const [clock, setClock] = useState('');
  const box = useRef<HTMLTextAreaElement>(null);
  const rec = useRef<any>(null);

  useEffect(() => {
    fetch('/api/brand').then((r) => r.json()).then(setBrand).catch(() => {});
    const t = () => setClock(new Date().toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }));
    t();
    const i = setInterval(t, 30000);
    return () => clearInterval(i);
  }, []);

  async function send(text = input) {
    const t = text.trim();
    if (!t || stage === 'routing' || stage === 'working') return;
    setErr('');
    setOut(null);
    setRoute(null);
    setStage('routing');
    setFocus('chief');
    try {
      const r1 = await fetch('/api/command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input: t, step: 'route' }) });
      const j1 = await r1.json();
      if (!r1.ok) throw new Error(j1.error);
      setRoute(j1.route);
      setFocus(j1.route.lane === 'brain' ? 'chief' : j1.route.lane);
      setStage('working');
      const r2 = await fetch('/api/command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input: t, route: j1.route }) });
      const j2 = await r2.json();
      if (!r2.ok) throw new Error(j2.error);
      setOut(j2.output);
      setStage('done');
      setInput('');
    } catch (e: any) {
      setErr(e.message || 'Something went wrong.');
      setStage('idle');
    }
  }

  function pickFormat(cmd: string) {
    setInput((v) => `${cmd} ${v.replace(/^\/\S+\s*/, '')}`);
    setFocus('content');
    box.current?.focus();
  }

  function mic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return setErr('Voice typing works in Chrome. Please type instead.');
    if (listening) return rec.current?.stop();
    const r = new SR();
    r.lang = 'en-IN';
    r.interimResults = false;
    r.onresult = (e: any) => setInput((v) => `${v} ${e.results[0][0].transcript}`.trim());
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }

  const busy = stage === 'routing' || stage === 'working';
  const lit = (node: string) => {
    if (!route) return node === 'chief' && busy;
    if (node === 'chief') return true;
    if (route.lane === 'content') return node === 'content' || node === route.command;
    return node === route.lane;
  };
  const Node = ({ id, icon }: { id: keyof typeof TEAM; icon: string }) => (
    <button className={`cc-node ${lit(id) ? 'lit' : ''} ${busy && lit(id) ? 'pulse' : ''} ${id === 'chief' ? 'chief' : ''}`} onClick={() => setFocus(id)}>
      <span className="cc-ico">{icon}</span>
      <span><b>{TEAM[id].title}</b><small>{TEAM[id].sub}</small></span>
    </button>
  );
  const actions: any[] = out?.kind === 'answer' && Array.isArray(out.data?.nextActions) ? out.data.nextActions : [];

  return (
    <div className="cc">
      <style>{`
        .cc { background: radial-gradient(1200px 600px at 30% -10%, #26365e 0%, #141c33 55%, #0e1426 100%); border-radius: 18px; padding: 22px; color: #e9ecf5; min-height: calc(100vh - 80px); }
        .cc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .cc-top h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: .02em; }
        .cc-state { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; border: 1px solid #3a4a74; color: #b9c3dd; }
        .cc-state.on { border-color: #f2b33d; color: #f2b33d; }
        .cc-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 18px; }
        @media (max-width: 1000px) { .cc-grid { grid-template-columns: 1fr; } }
        .cc-org { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 8px 0 4px; }
        .cc-row { display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; }
        .cc-line { width: 2px; height: 26px; background: linear-gradient(#3a4a74, #3a4a74); }
        .cc-line.lit { background: #f2b33d; box-shadow: 0 0 10px #f2b33d88; }
        .cc-node { display: flex; align-items: center; gap: 12px; text-align: left; background: #182240; border: 1px solid #2c3a63; color: #e9ecf5; border-radius: 14px; padding: 12px 16px; min-width: 190px; cursor: pointer; transition: all .25s; }
        .cc-node b { display: block; font-size: 15px; } .cc-node small { color: #93a0c3; font-size: 12px; }
        .cc-node.chief { min-width: 260px; padding: 16px 20px; }
        .cc-node.lit { border-color: #f2b33d; box-shadow: 0 0 0 1px #f2b33d55, 0 0 26px #f2b33d33; }
        .cc-node.pulse { animation: ccp 1.2s ease-in-out infinite; }
        @keyframes ccp { 50% { box-shadow: 0 0 0 1px #f2b33d, 0 0 38px #f2b33d66; } }
        .cc-ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: #223060; color: #f2b33d; font-size: 16px; }
        .cc-fmt { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; width: 100%; margin-top: 2px; }
        @media (max-width: 700px) { .cc-fmt { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .cc-f { background: #141d38; border: 1px solid #2c3a63; color: #cfd6ea; border-radius: 12px; padding: 10px 4px; font-size: 12px; cursor: pointer; transition: all .25s; }
        .cc-f span { display: block; font-size: 18px; color: #f2b33d; margin-bottom: 4px; }
        .cc-f.lit { border-color: #f2b33d; color: #fff; box-shadow: 0 0 18px #f2b33d33; }
        .cc-box { margin-top: 18px; background: #101830; border: 1px solid #2c3a63; border-radius: 14px; padding: 10px; display: flex; gap: 8px; align-items: flex-end; }
        .cc-box textarea { flex: 1; background: transparent; border: 0; color: #fff; resize: none; font: inherit; font-size: 15px; min-height: 48px; outline: none; padding: 6px; }
        .cc-box textarea::placeholder { color: #7f8bb0; }
        .cc-btn { border: 0; border-radius: 10px; padding: 10px 14px; font-weight: 700; cursor: pointer; }
        .cc-mic { background: #1d2850; color: #cfd6ea; } .cc-mic.on { background: #e8603c; color: #fff; }
        .cc-go { background: #f2b33d; color: #141c33; } .cc-go:disabled { opacity: .5; }
        .cc-panel { background: #fbf8f2; color: #1b1b1b; border-radius: 16px; padding: 18px; min-height: 420px; }
        .cc-panel .out { border: 0; padding: 0; box-shadow: none; background: transparent; }
        .cc-intro h3 { margin: 0 0 6px; } .cc-route { font-size: 13px; color: #4a4a52; margin-bottom: 12px; }
        .cc-act { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
      `}</style>

      <div className="cc-top">
        <h1>Command Centre</h1>
        <div className="row" style={{ gap: 10 }}>
          <span className="muted" style={{ color: '#93a0c3', fontSize: 12 }}>{clock}</span>
          <span className={`cc-state ${busy ? 'on' : ''}`}>● {stage === 'routing' ? 'Routing' : stage === 'working' ? 'Working' : 'Standby'}</span>
        </div>
      </div>

      <div className="cc-grid">
        <div>
          <div className="cc-org">
            <Node id="chief" icon="✦" />
            <div className={`cc-line ${route ? 'lit' : ''}`} />
            <div className="cc-row">
              <Node id="strategist" icon="◆" />
              <Node id="research" icon="⌕" />
              <Node id="content" icon="✎" />
            </div>
            <div className={`cc-line ${route?.lane === 'content' ? 'lit' : ''}`} />
            <div className="cc-fmt">
              {FORMATS.map((f) => (
                <button key={f.cmd} className={`cc-f ${route?.command === f.cmd ? 'lit' : ''}`} onClick={() => pickFormat(f.cmd)} title={`Start with ${f.cmd}`}>
                  <span>{f.icon}</span>{f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="cc-box">
            <textarea
              ref={box}
              rows={2}
              placeholder="Tell your team what you need. e.g. “Make a carousel on why referrals are not a pipeline” or “What should I post this week to book more calls?”"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button className={`cc-btn cc-mic ${listening ? 'on' : ''}`} onClick={mic} title="Speak">{listening ? '■' : '🎙'}</button>
            <button className="cc-btn cc-go" disabled={busy || !input.trim()} onClick={() => send()}>{busy ? '…' : 'Send'}</button>
          </div>
          {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
        </div>

        <div className="cc-panel">
          {!out && (
            <div className="cc-intro">
              <h3>{TEAM[focus].title}</h3>
              <p className="muted">{TEAM[focus].about}</p>
              {busy && route && <p className="cc-route"><span className="spinner" /> {route.reason || 'Working on it…'}</p>}
              {busy && !route && <p className="cc-route"><span className="spinner" /> Reading your instruction…</p>}
              {!busy && (
                <p className="muted" style={{ fontSize: 13 }}>
                  Tip: click a format below the team to start with it, or type <b>/</b> commands as in the <Link href="/">Studio</Link>. Everything is saved in <Link href="/history">History</Link>.
                </p>
              )}
            </div>
          )}
          {out && (
            <>
              {route && <div className="cc-route">Handled by <b>{route.lane === 'content' ? `Content → ${FORMATS.find((f) => f.cmd === route.command)?.label || route.command}` : route.lane === 'brain' ? 'Chief' : TEAM[route.lane].title}</b>{route.reason ? ` · ${route.reason}` : ''}</div>}
              {out.kind === 'answer' ? (
                <>
                  <h3 style={{ marginTop: 0 }}>{out.title}</h3>
                  <div className="post" dangerouslySetInnerHTML={{ __html: md(out.data?.answer) }} />
                  {!!actions.length && (
                    <>
                      <p className="muted" style={{ margin: '14px 0 0', fontSize: 13 }}>Send to Content:</p>
                      <div className="cc-act">
                        {actions.slice(0, 4).map((a, i) => (
                          <button key={i} className="btn small" disabled={busy} onClick={() => send(`${a.command} ${a.brief}`)}>{a.label}</button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <OutputView key={out.id} out={out} brand={brand} autoDraw />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

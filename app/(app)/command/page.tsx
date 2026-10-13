'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import OutputView from '@/components/OutputView';
import BrainField from '@/components/BrainField';
import { EMPTY_BRAND, type BrandKit, type Output } from '@/lib/types';
import { COMMANDS } from '@/lib/commands';

type Lane = 'strategist' | 'research' | 'content' | 'brain';
type Route = { lane: Lane; command: string; reason: string };
type Bubble = { tag: string; text: string; tone: 'route' | 'work' | 'report' | 'online' | 'done' } | null;

function md(t: string) {
  const esc = String(t || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
  return esc.replace(/^#{1,3}\s*(.+)$/gm, '<b>$1</b>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

const EXAMPLES: Record<string, string> = {
  '/carousel': 'e.g. 7 slides on why founders do not have a pipeline problem',
  '/leadmagnet': 'e.g. a 1-page checklist: is your business ready for automation?',
  '/image': 'e.g. the moment I stopped chasing leads by hand',
  '/text': 'e.g. a contrarian take on cold outreach',
  '/reel': 'e.g. 30 seconds on my weekly content routine',
  '/video': 'e.g. 10 minutes on building a client journey',
  '/newsletter': 'e.g. what I learned helping founders automate this month',
};

const FORMATS = [
  { cmd: '/text', label: 'Text', icon: '¶', doing: 'Writing the post' },
  { cmd: '/image', label: 'Picture', icon: '▣', doing: 'Writing and art-directing the image' },
  { cmd: '/carousel', label: 'Carousel', icon: '❐', doing: 'Writing and art-directing the slides' },
  { cmd: '/leadmagnet', label: 'Lead magnet', icon: '◈', doing: 'Building the free guide' },
  { cmd: '/reel', label: 'Reels', icon: '▶', doing: 'Scripting the reel' },
  { cmd: '/video', label: 'Long-form', icon: '◉', doing: 'Scripting the long video' },
  { cmd: '/newsletter', label: 'Newsletter', icon: '✉', doing: 'Writing the newsletter' },
];

// Fixed drawing board, scaled to fit.
const W = 780, H = 640;
const BOX = { chief: { x: 240, y: 30, w: 300, h: 96 }, strategist: { x: 40, y: 210, w: 230, h: 84 }, research: { x: 510, y: 210, w: 230, h: 84 }, content: { x: 275, y: 390, w: 230, h: 84 } };
const FX = (i: number) => 14 + i * 108; // format boxes: 7 × 96 wide
const FY = 556;

export default function CommandCentre() {
  const [brand, setBrand] = useState<BrandKit>(EMPTY_BRAND);
  const [notes, setNotes] = useState<{ id: string; links: string[] }[]>([]);
  const [input, setInput] = useState('');
  const [route, setRoute] = useState<Route | null>(null);
  const [stage, setStage] = useState<'idle' | 'route' | 'research' | 'make' | 'done'>('idle');
  const [bubbles, setBubbles] = useState<Record<string, Bubble>>({});
  const [active, setActive] = useState<string[]>([]);
  const [out, setOut] = useState<Output | null>(null);
  const [err, setErr] = useState('');
  const [pictures, setPictures] = useState(false);
  const [listening, setListening] = useState(false);
  const [clock, setClock] = useState('');
  const [scale, setScale] = useState(1);
  const [menuIndex, setMenuIndex] = useState(0);
  const board = useRef<HTMLDivElement>(null);
  const rec = useRef<any>(null);

  useEffect(() => {
    fetch('/api/brand').then((r) => r.json()).then(setBrand).catch(() => {});
    fetch('/api/vault').then((r) => r.json()).then((v) => setNotes((v.notes || []).map((n: any) => ({ id: n.id, links: n.links || [] })))).catch(() => {});
    const t = () => setClock(new Date().toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    t();
    const i = setInterval(t, 1000);
    return () => clearInterval(i);
  }, []);

  useLayoutEffect(() => {
    const el = board.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const say = (node: string, b: Bubble) => setBubbles((x) => ({ ...x, [node]: b }));
  const sample = (k: number) => [...notes].sort(() => Math.random() - 0.5).slice(0, k).map((n) => n.id);

  async function call(body: object) {
    const r = await fetch('/api/command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Something went wrong.');
    return j;
  }

  async function send(text = input) {
    const t = text.trim();
    if (!t || (stage !== 'idle' && stage !== 'done')) return;
    setErr(''); setOut(null); setRoute(null); setBubbles({});
    setStage('route');
    setActive(sample(8));
    say('chief', { tag: 'Reading', text: 'Reading your instruction and your notes', tone: 'work' });
    try {
      const { route: r } = await call({ input: t, step: 'route' });
      setRoute(r);
      const fmt = FORMATS.find((f) => f.cmd === r.command);
      let brief: any = null;

      if (r.lane === 'content') {
        say('chief', { tag: 'Route', text: `${r.command}: Research sharpens the angle, then Content writes`, tone: 'route' });
        setStage('research');
        say('research', { tag: 'Working', text: 'Finding the strongest angle in your notes', tone: 'work' });
        say('strategist', { tag: 'Working', text: 'Delegating to 1 content producer', tone: 'work' });
        setActive(sample(14));
        ({ brief } = await call({ input: t, step: 'research', route: r }));
        setActive(brief.notes?.length ? brief.notes : sample(10));
        say('research', { tag: '↑ Report', text: `Research → Chief: brief delivered${brief.angle ? `: ${brief.angle.slice(0, 70)}${brief.angle.length > 70 ? '…' : ''}` : ''}`, tone: 'report' });
        say('content', { tag: 'Online', text: `${fmt?.doing || 'Writing'} in your voice`, tone: 'online' });
      } else {
        const who = r.lane === 'brain' ? 'chief' : r.lane;
        say('chief', { tag: 'Route', text: r.reason || `Handing this to ${r.lane}`, tone: 'route' });
        if (who !== 'chief') say(who, { tag: 'Working', text: r.lane === 'strategist' ? 'Building your plan from your notes' : 'Collecting angles from your notes', tone: 'work' });
        setActive(sample(14));
      }

      setStage('make');
      const { output } = await call({ input: t, step: 'make', route: r, brief });
      setOut(output);
      setActive(output.sources || []);
      setStage('done');
      setInput('');
      if (r.lane === 'content') {
        say('content', { tag: 'Done', text: `${fmt?.label || 'Piece'} delivered to the Chief`, tone: 'done' });
        say('strategist', { tag: 'Done', text: 'Delivered', tone: 'done' });
      } else if (r.lane !== 'brain') say(r.lane, { tag: '↑ Report', text: 'Delivered to the Chief', tone: 'report' });
      say('chief', { tag: 'Done', text: 'Ready on the right. Approve it or send it to Content.', tone: 'done' });
    } catch (e: any) {
      setErr(e.message || 'Something went wrong.');
      setStage('idle');
      setBubbles({});
    }
  }

  function pickFormat(cmd: string) {
    setInput((v) => `${cmd} ${v.replace(/^\/\S+\s*/, '')}`);
  }

  function mic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return setErr('Voice typing works in Chrome. Please type instead.');
    if (listening) return rec.current?.stop();
    const r = new SR();
    r.lang = 'en-IN';
    r.onresult = (e: any) => setInput((v) => `${v} ${e.results[0][0].transcript}`.trim());
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }

  const typing = /^\/\S*$/.test(input.trim()) && !input.includes(' ');
  const q = input.trim().toLowerCase();
  const matches = COMMANDS.filter((c) => c.cmd.startsWith(q) || c.aliases.some((a) => a.startsWith(q)));
  const showMenu = typing && matches.length > 0;
  function choose(cmd: string) {
    setInput(cmd + ' ');
    setMenuIndex(0);
  }

  const busy = stage === 'route' || stage === 'research' || stage === 'make';
  const lane = route?.lane;
  const on = {
    chief: stage !== 'idle',
    strategist: lane === 'strategist' || lane === 'content',
    research: lane === 'research' || lane === 'content',
    content: lane === 'content',
  };
  const fmt = FORMATS.find((f) => f.cmd === route?.command);
  const actions: any[] = out?.kind === 'answer' && Array.isArray(out.data?.nextActions) ? out.data.nextActions : [];

  const Box = ({ id, icon, title, sub, big }: { id: keyof typeof BOX; icon: string; title: string; sub: string; big?: boolean }) => {
    const b = BOX[id];
    return (
      <div className={`cc-node ${on[id] ? 'on' : ''} ${busy && on[id] ? 'pulse' : ''} cc-${id}`} style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
        <span className="cc-ico" style={big ? { width: 52, height: 52, fontSize: 22 } : undefined}>{icon}</span>
        <span>{big && <small className="cc-kicker">AI CHIEF</small>}<b style={big ? { fontSize: 22 } : undefined}>{title}</b><small>{sub}</small></span>
      </div>
    );
  };
  const Bub = ({ id, x, y }: { id: string; x: number; y: number }) => {
    const b = bubbles[id];
    if (!b) return null;
    return (
      <div className={`cc-bub ${b.tone}`} style={{ left: x, top: y }}>
        <small>● {b.tag}</small>
        <div>{b.text}</div>
      </div>
    );
  };
  const path = (d: string, live: boolean, dashed = false) => <path d={d} className={`${live ? 'live' : ''} ${dashed ? 'dash' : ''}`} />;
  const cx = (k: keyof typeof BOX) => BOX[k].x + BOX[k].w / 2;
  const fi = FORMATS.findIndex((f) => f.cmd === route?.command);

  return (
    <div className="cc">
      <style>{`
        .cc { background: radial-gradient(900px 500px at 35% 0%, #17224a 0%, #0b1022 55%, #070a16 100%); border-radius: 18px; padding: 18px 20px 20px; color: #e9ecf5; min-height: calc(100vh - 70px); display: flex; flex-direction: column; }
        .cc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .cc-brand { letter-spacing: .28em; font-weight: 700; font-size: 14px; color: #fff; display: flex; gap: 10px; align-items: center; }
        .cc-brand img { width: 28px; height: 28px; border-radius: 8px; background: #fff; padding: 3px; }
        .cc-sub { letter-spacing: .2em; font-size: 10px; color: #7d89ad; text-transform: uppercase; }
        .cc-clock { font-size: 11px; letter-spacing: .14em; color: #7d89ad; text-transform: uppercase; font-variant-numeric: tabular-nums; }
        .cc-state { font-size: 10px; letter-spacing: .16em; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; border: 1px solid #2a3760; color: #9aa6c9; }
        .cc-state.on { border-color: #2fd3b5; color: #2fd3b5; box-shadow: 0 0 14px #2fd3b555; }
        .cc-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr); gap: 18px; flex: 1; }
        @media (max-width: 1100px) { .cc-grid { grid-template-columns: 1fr; } }
        .cc-board { position: relative; width: 100%; }
        .cc-canvas { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: top left; }
        .cc-canvas svg { position: absolute; inset: 0; overflow: visible; }
        .cc-canvas path { fill: none; stroke: #26335c; stroke-width: 1.6; transition: stroke .4s; }
        .cc-canvas path.dash { stroke-dasharray: 4 6; }
        .cc-canvas path.live { stroke: #f2b33d; stroke-dasharray: 6 8; animation: ccflow 1s linear infinite; filter: drop-shadow(0 0 4px #f2b33d99); }
        @keyframes ccflow { to { stroke-dashoffset: -28; } }
        .cc-node { position: absolute; display: flex; align-items: center; gap: 14px; background: linear-gradient(180deg, #141d3a, #0f162e); border: 1px solid #25325a; border-radius: 14px; padding: 0 18px; box-sizing: border-box; transition: all .35s; }
        .cc-node b { display: block; font-size: 17px; color: #fff; } .cc-node small { display: block; color: #8592b8; font-size: 12px; }
        .cc-kicker { color: #2fd3b5 !important; letter-spacing: .2em; font-size: 10px !important; font-weight: 700; }
        .cc-node.on { border-color: #f2b33d99; box-shadow: 0 0 0 1px #f2b33d33, 0 0 30px #f2b33d22; }
        .cc-chief.on { border-color: #2fd3b5; box-shadow: 0 0 0 1px #2fd3b555, 0 0 40px #2fd3b533; }
        .cc-node.pulse { animation: ccp 1.4s ease-in-out infinite; }
        @keyframes ccp { 50% { box-shadow: 0 0 0 1px #f2b33d, 0 0 46px #f2b33d55; } }
        .cc-ico { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: #1b2650; color: #f2b33d; font-size: 17px; flex: none; border: 1px solid #2d3b6a; }
        .cc-chief .cc-ico { color: #2fd3b5; }
        .cc-f { position: absolute; top: ${FY}px; width: 96px; height: 74px; background: #0f162e; border: 1px solid #222e55; color: #aab4d4; border-radius: 12px; font-size: 12px; cursor: pointer; transition: all .3s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
        .cc-f span { font-size: 18px; color: #6f7ca3; }
        .cc-f:hover { border-color: #3a4a80; color: #fff; }
        .cc-f.on { border-color: #e06bd8; color: #fff; box-shadow: 0 0 0 2px #2fd3b5aa, 0 0 26px #e06bd855; }
        .cc-f.on span { color: #e06bd8; }
        .cc-bub { position: absolute; width: 200px; background: #0c1328ee; border: 1px solid #25325a; border-radius: 10px; padding: 8px 10px; font-size: 12px; line-height: 1.35; color: #dfe5f6; animation: ccin .35s ease-out; }
        .cc-bub small { display: block; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; margin-bottom: 3px; }
        .cc-bub.route small { color: #2fd3b5; } .cc-bub.work small { color: #f2b33d; } .cc-bub.report small { color: #7fb2ff; } .cc-bub.online small { color: #e06bd8; } .cc-bub.done small { color: #4cd38a; }
        @keyframes ccin { from { opacity: 0; transform: translateY(6px); } }
        .cc-box { margin-top: 12px; background: #0d1430; border: 1px solid #25325a; border-radius: 14px; padding: 8px; display: flex; gap: 8px; align-items: flex-end; }
        .cc-box textarea { flex: 1; background: transparent; border: 0; color: #fff; resize: none; font: inherit; font-size: 15px; min-height: 46px; outline: none; padding: 6px 8px; }
        .cc-box textarea::placeholder { color: #67739a; }
        .cc-btn { border: 0; border-radius: 10px; padding: 10px 14px; font-weight: 700; cursor: pointer; }
        .cc-mic { background: #18224a; color: #cfd6ea; } .cc-mic.on { background: #e8603c; color: #fff; }
        .cc-go { background: #f2b33d; color: #10172f; } .cc-go:disabled { opacity: .45; }
        .cc-menu { position: absolute; left: 0; right: 0; bottom: calc(100% + 8px); background: #0c1328f7; border: 1px solid #2a3760; border-radius: 14px; padding: 8px; z-index: 5; box-shadow: 0 20px 50px #0009; backdrop-filter: blur(6px); max-height: 340px; overflow-y: auto; }
        .cc-menu button { display: flex; gap: 12px; align-items: center; width: 100%; text-align: left; background: transparent; border: 0; color: #e9ecf5; padding: 6px 10px; border-radius: 10px; cursor: pointer; min-width: 0; }
        .cc-menu button > span:last-child { min-width: 0; flex: 1; }
        .cc-menu button.on { background: #18224a; }
        .cc-menu b { font-family: ui-monospace, Menlo, monospace; font-size: 14px; } .cc-menu em { font-style: normal; color: #8592b8; font-size: 12px; margin-left: 6px; }
        .cc-menu small { display: block; color: #7d89ad; font-size: 11.5px; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cc-mi { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: #18224a; color: #f2b33d; flex: none; }
        .cc-opts { display: flex; gap: 14px; align-items: center; margin-top: 8px; font-size: 12px; color: #8592b8; }
        .cc-panel { position: relative; border: 1px solid #25325a; border-radius: 18px; background: radial-gradient(500px 400px at 50% 40%, #1a1440 0%, #0a0f22 70%); overflow: hidden; min-height: 560px; display: flex; flex-direction: column; }
        .cc-field { flex: 1; min-height: 360px; position: relative; } .cc-field canvas { position: absolute; inset: 0; }
        .cc-cap { text-align: center; padding: 0 20px 22px; }
        .cc-cap b { display: block; color: #fff; font-size: 17px; margin-bottom: 4px; } .cc-cap span { color: #8d98bd; font-size: 13px; }
        .cc-cap .tag { color: #e06bd8; letter-spacing: .16em; font-size: 11px; font-weight: 700; }
        .cc-result { background: #fbf8f2; color: #1b1b1b; margin: 12px; border-radius: 14px; padding: 16px; overflow: auto; max-height: calc(100vh - 150px); }
        .cc-result .out { border: 0; padding: 0; box-shadow: none; background: transparent; }
        .cc-meta { font-size: 12px; color: #4a4a52; margin-bottom: 10px; }
      `}</style>

      <div className="cc-top">
        <div>
          <div className="cc-brand">{brand.logoUrl && <img src={brand.logoUrl} alt="" />}COMMAND CENTRE</div>
          <div className="cc-sub" style={{ marginTop: 6 }}>Your AI team</div>
        </div>
        <div className="row" style={{ gap: 12 }}>
          <span className="cc-clock">{clock}</span>
          <span className={`cc-state ${busy ? 'on' : ''}`}>● {busy ? 'Live run' : 'Standby'}</span>
        </div>
      </div>

      <div className="cc-grid">
        <div>
          <div className="cc-board" ref={board} style={{ height: H * scale }}>
            <div className="cc-canvas" style={{ transform: `scale(${scale})` }}>
              <svg width={W} height={H}>
                {path(`M${cx('chief')} 126 V170 H${cx('strategist')} V210`, on.strategist && busy)}
                {path(`M${cx('chief')} 126 V170 H${cx('research')} V210`, on.research && busy)}
                {path(`M270 252 H510`, lane === 'content' && busy, true)}
                {path(`M${cx('strategist')} 294 V340 H${cx('content')} V390`, on.content && busy)}
                {FORMATS.map((f, i) => (
                  <g key={f.cmd}>{path(`M${cx('content')} 474 V515 H${FX(i) + 48} V${FY}`, fi === i && busy)}</g>
                ))}
              </svg>
              <Box id="chief" icon="✦" title="Chief" sub="Reads every note" big />
              <Box id="strategist" icon="◆" title="Strategist" sub="Marketing (CMO)" />
              <Box id="research" icon="⌕" title="Research" sub="Angles & ideas" />
              <Box id="content" icon="✎" title="Content" sub="Posts in your voice" />
              {FORMATS.map((f, i) => (
                <button key={f.cmd} className={`cc-f ${fi === i && stage !== 'idle' ? 'on' : ''}`} style={{ left: FX(i) }} onClick={() => pickFormat(f.cmd)} title={`Start with ${f.cmd}`}>
                  <span>{f.icon}</span>{f.label}
                </button>
              ))}
              <Bub id="chief" x={550} y={40} />
              <Bub id="strategist" x={60} y={302} />
              <Bub id="research" x={530} y={302} />
              <Bub id="content" x={515} y={410} />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
          {showMenu && (
            <div className="cc-menu">
              <div className="cc-sub" style={{ padding: '4px 10px 8px' }}>Commands</div>
              {matches.map((c, i) => {
                const f = FORMATS.find((x) => x.cmd === c.cmd);
                return (
                  <button key={c.cmd} className={i === menuIndex ? 'on' : ''} onMouseEnter={() => setMenuIndex(i)} onMouseDown={(e) => { e.preventDefault(); choose(c.cmd); }}>
                    <span className="cc-mi">{f?.icon || '•'}</span>
                    <span>
                      <b>{c.cmd}</b> <em>{c.label}</em>
                      <small>{c.hint} · {EXAMPLES[c.cmd] || ''}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="cc-box">
            <textarea
              rows={2}
              placeholder={busy ? 'Your team is working…' : 'Tell your Chief what you need, or type / for a format. e.g. “Make a carousel on why referrals are not a pipeline”'}
              value={input}
              disabled={busy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (showMenu) {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setMenuIndex((i) => (i + 1) % matches.length); return; }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setMenuIndex((i) => (i - 1 + matches.length) % matches.length); return; }
                  if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); choose(matches[Math.min(menuIndex, matches.length - 1)].cmd); return; }
                  if (e.key === 'Escape') { setInput(''); return; }
                }
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
            />
            <button className={`cc-btn cc-mic ${listening ? 'on' : ''}`} onClick={mic} title="Speak">{listening ? '■' : '🎙'}</button>
            <button className="cc-btn cc-go" disabled={busy || !input.trim() || showMenu} onClick={() => send()}>↑</button>
          </div>
          </div>
          <div className="cc-opts">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={pictures} onChange={(e) => setPictures(e.target.checked)} /> Draw AI pictures on carousel slides (OpenAI key, takes a few minutes)</label>
          </div>
          {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
        </div>

        <div className="cc-panel">
          {!out ? (
            <>
              <div className="cc-field"><BrainField notes={notes} active={active} busy={busy} /></div>
              <div className="cc-cap">
                {busy ? (
                  <>
                    <div className="tag">● {fmt ? fmt.label.toUpperCase() : route ? route.lane.toUpperCase() : 'CHIEF'}</div>
                    <span>{stage === 'route' ? 'Reading your instruction' : stage === 'research' ? 'Research is finding the angle in your notes' : fmt ? `${fmt.doing}${route?.command === '/carousel' ? '' : ''}` : 'Working from your notes'}</span>
                  </>
                ) : (
                  <>
                    <b>Chief</b>
                    <span>Your Chief reads every note ({notes.length}) and routes every marketing job. Give it one instruction.</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="cc-result">
              {route && (
                <div className="cc-meta">
                  Handled by <b>{route.lane === 'content' ? `Research → Content → ${fmt?.label || route.command}` : route.lane === 'brain' ? 'Chief' : route.lane === 'strategist' ? 'Strategist' : 'Research'}</b>
                  {' · '}<Link href="/history">History</Link>
                </div>
              )}
              {out.kind === 'answer' ? (
                <>
                  <h3 style={{ marginTop: 0 }}>{out.title}</h3>
                  <div className="post" dangerouslySetInnerHTML={{ __html: md(out.data?.answer) }} />
                  {!!actions.length && (
                    <>
                      <p className="muted" style={{ margin: '14px 0 6px', fontSize: 13 }}>Send to Content:</p>
                      <div className="row" style={{ flexWrap: 'wrap' }}>
                        {actions.slice(0, 4).map((a, i) => (
                          <button key={i} className="btn small" disabled={busy} onClick={() => send(`${a.command} ${a.brief}`)}>{a.label}</button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <OutputView key={out.id} out={out} brand={brand} autoDraw autoIllustrate={pictures} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

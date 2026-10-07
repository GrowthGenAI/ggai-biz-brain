'use client';
import { useEffect, useState } from 'react';
import Slide, { fontHref } from '@/components/Slide';
import { EMPTY_BRAND, type BrandKit } from '@/lib/types';

const COLOR_KEYS: (keyof BrandKit['colors'])[] = ['primary', 'secondary', 'accent', 'background', 'text'];

function readiness(b: BrandKit) {
  const checks = [b.founderName, b.brandName, b.role, b.handle, b.tagline, b.website, b.voice, b.neverSay, b.defaultCta, b.headshotUrl, b.logoUrl, b.updatedAt];
  return Math.round((checks.filter((x) => !!(x && String(x).trim())).length / checks.length) * 100);
}

export default function Brand() {
  const [b, setB] = useState<BrandKit>(EMPTY_BRAND);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { fetch('/api/brand').then((r) => r.json()).then(setB); }, []);

  const set = (k: keyof BrandKit, v: any) => setB((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy('Saving…'); setErr(''); setMsg('');
    const res = await fetch('/api/brand', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
    const j = await res.json();
    setBusy('');
    if (!res.ok) return setErr(j.error || 'Could not save.');
    setB(j);
    setMsg('Brand system saved.');
  }

  async function fillFromBrain() {
    setBusy('Reading brand-identity and voice-dna from your brain…'); setErr(''); setMsg('');
    const res = await fetch('/api/brand/import', { method: 'POST' });
    const j = await res.json();
    setBusy('');
    if (!res.ok) return setErr(j.error || 'Could not read your brain.');
    setB((x) => ({ ...x, ...j, colors: { ...x.colors, ...j.colors }, fonts: { ...x.fonts, ...j.fonts } }));
    setMsg('Filled from your brain. Check every field, then press Save brand system.');
  }

  async function upload(kind: 'headshotUrl' | 'logoUrl', file: File) {
    setBusy('Uploading…'); setErr('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const j = await res.json();
    setBusy('');
    if (!res.ok) return setErr(j.error);
    set(kind, j.url);
  }

  const score = readiness(b);
  const href = fontHref(b);

  return (
    <div className="stack" style={{ gap: 22 }}>
      {href && <link rel="stylesheet" href={href} />}
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>Brand Kit</h1>
          <p className="sub" style={{ margin: 0 }}>Everything you make uses these colours, fonts, photos and voice rules.</p>
        </div>
        <div style={{ minWidth: 220 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><b>Readiness</b><b>{score}%</b></div>
          <div className="meter"><i style={{ width: `${score}%` }} /></div>
        </div>
      </div>

      <div className="row">
        <button className="btn amber" onClick={fillFromBrain} disabled={!!busy}>Fill from my brain</button>
        <button className="btn" onClick={save} disabled={!!busy}>Save brand system</button>
        {busy && <span className="row muted"><span className="spinner" /> {busy}</span>}
      </div>
      {msg && <div className="note">✓ {msg}</div>}
      {err && <div className="err">{err}</div>}

      <div className="grid2">
        <div className="card stack">
          <h2>Identity</h2>
          <label className="f">Founder name<input className="in" value={b.founderName} onChange={(e) => set('founderName', e.target.value)} /></label>
          <label className="f">Role<span className="h">e.g. Founder, Growth GenAI</span><input className="in" value={b.role} onChange={(e) => set('role', e.target.value)} /></label>
          <label className="f">Brand name<input className="in" value={b.brandName} onChange={(e) => set('brandName', e.target.value)} /></label>
          <label className="f">Handle<span className="h">e.g. @sujatasshetty</span><input className="in" value={b.handle} onChange={(e) => set('handle', e.target.value)} /></label>
          <label className="f">Tagline<input className="in" value={b.tagline} onChange={(e) => set('tagline', e.target.value)} /></label>
          <label className="f">Website or LinkedIn<input className="in" value={b.website} onChange={(e) => set('website', e.target.value)} /></label>
          <label className="f">Default call to action<span className="h">e.g. Comment ENGINE for the free checklist</span><input className="in" value={b.defaultCta} onChange={(e) => set('defaultCta', e.target.value)} /></label>
        </div>

        <div className="stack">
          <div className="card stack">
            <h2>Photos</h2>
            <div className="grid2">
              {(['headshotUrl', 'logoUrl'] as const).map((k) => (
                <div key={k} className="stack" style={{ gap: 8 }}>
                  <b>{k === 'headshotUrl' ? 'Founder face' : 'Logo mark'}</b>
                  {b[k] ? <img src={b[k]} alt="" style={{ width: 110, height: 110, objectFit: k === 'headshotUrl' ? 'cover' : 'contain', borderRadius: k === 'headshotUrl' ? '50%' : 12, border: '1px solid var(--line)' }} /> : <div className="drop" style={{ padding: 18 }}>None yet</div>}
                  <label className="btn small ghost" style={{ alignSelf: 'flex-start' }}>
                    Upload<input type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => e.target.files?.[0] && upload(k, e.target.files[0])} />
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="card stack">
            <h2>Colours and fonts</h2>
            <div className="row" style={{ gap: 14 }}>
              {COLOR_KEYS.map((k) => (
                <label key={k} className="f" style={{ alignItems: 'center' }}>
                  <input type="color" className="swatch" value={b.colors[k]} onChange={(e) => setB((x) => ({ ...x, colors: { ...x.colors, [k]: e.target.value.toUpperCase() } }))} />
                  <span style={{ textTransform: 'capitalize' }}>{k}</span>
                  <input className="in" style={{ width: 92, padding: '4px 6px', fontSize: 12 }} value={b.colors[k]} onChange={(e) => setB((x) => ({ ...x, colors: { ...x.colors, [k]: e.target.value } }))} />
                </label>
              ))}
            </div>
            <div className="grid2">
              <label className="f">Heading font<span className="h">Any Google Font name</span><input className="in" value={b.fonts.heading} onChange={(e) => setB((x) => ({ ...x, fonts: { ...x.fonts, heading: e.target.value } }))} /></label>
              <label className="f">Body font<input className="in" value={b.fonts.body} onChange={(e) => setB((x) => ({ ...x, fonts: { ...x.fonts, body: e.target.value } }))} /></label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card stack">
          <h2>Voice</h2>
          <label className="f">How I write<span className="h">Paste the key lines from voice-dna.md</span><textarea className="in" rows={7} value={b.voice} onChange={(e) => set('voice', e.target.value)} /></label>
          <label className="f">Never use<span className="h">One word or phrase per line</span><textarea className="in" rows={5} value={b.neverSay} onChange={(e) => set('neverSay', e.target.value)} /></label>
        </div>
        <div className="card stack">
          <h2>Preview</h2>
          <div className="row" style={{ gap: 12 }}>
            <div className="slide-wrap"><div><Slide brand={b} n={1} total={7} slide={{ kind: 'cover', heading: 'Your posts sound like you again', body: 'A preview of your cover slide in your colours and fonts' }} /></div></div>
            <div className="slide-wrap"><div><Slide brand={b} n={2} total={7} slide={{ kind: 'content', heading: 'One idea per slide', bullets: ['Short lines', 'Your colours', 'Your face on every page'] }} /></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import Slide, { fontHref, isDark } from './Slide';
import { IG_MAX_SLIDES, download, fitImage, inlineFontCss, sameOrigin, slidesToZip, slug } from '@/lib/formats';
import type { BrandKit, Output } from '@/lib/types';

const KIND_LABEL: Record<string, string> = {
  text: 'TEXT POST', carousel: 'CAROUSEL', image: 'IMAGE', newsletter: 'NEWSLETTER', reel: 'REEL', video: 'VIDEO', answer: 'ANSWER',
};

function copy(text: string, set: (s: string) => void) {
  navigator.clipboard.writeText(text).then(() => {
    set('Copied');
    setTimeout(() => set(''), 1500);
  });
}

export function postText(d: any) {
  const norm = (t: string) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  let body = String(d.body || '');
  if (d.hook && norm(body).startsWith(norm(d.hook))) body = body.slice(String(d.hook).length).trim();
  const cta = d.cta && norm(body).includes(norm(d.cta)) ? '' : d.cta;
  return [d.hook, body, cta, (d.hashtags || []).map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ')].filter(Boolean).join('\n\n');
}

function newsletterText(d: any) {
  return [
    `Subject: ${d.subject}`,
    `Preheader: ${d.preheader}`,
    '',
    ...(d.sections || []).flatMap((s: any) => [s.heading ? `## ${s.heading}` : '', s.body, '']),
    d.action ? `→ ${d.action.label}: ${d.action.detail}` : '',
    '',
    d.ps ? `P.S. ${d.ps}` : '',
  ].join('\n');
}

function esc(s: string) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

function newsletterHtml(d: any, b: BrandKit) {
  const c = b.colors;
  const para = (t: string) => esc(t).split(/\n{2,}/).map((p) => `<p style="margin:0 0 16px">${p.replace(/\n/g, '<br>')}</p>`).join('');
  return `<!doctype html><html><body style="margin:0;background:${c.background};font-family:Arial,Helvetica,sans-serif;color:${c.text}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden">
${d.heroUrl ? `<tr><td><img src="${d.heroUrl}" width="600" style="display:block;width:100%" alt=""></td></tr>` : ''}
<tr><td style="padding:32px;font-size:16px;line-height:1.6">
${(d.sections || []).map((s: any) => `${s.heading ? `<h2 style="font-family:Georgia,serif;color:${c.primary};font-size:22px;margin:24px 0 10px">${esc(s.heading)}</h2>` : ''}${para(s.body)}`).join('')}
${d.action ? `<p style="margin:28px 0"><span style="background:${c.secondary};color:${isDark(c.secondary) ? '#fff' : c.text};padding:12px 20px;border-radius:8px;font-weight:bold;display:inline-block">${esc(d.action.label)}</span></p><p>${esc(d.action.detail)}</p>` : ''}
${d.ps ? `<p style="margin-top:24px"><b>P.S.</b> ${esc(d.ps)}</p>` : ''}
<p style="margin-top:28px;color:#888;font-size:13px">${esc(b.founderName || b.brandName)}${b.website ? ` · ${esc(b.website)}` : ''}</p>
</td></tr></table></td></tr></table></body></html>`;
}

export default function OutputView({ out: initial, brand, autoDraw = false }: { out: Output; brand: BrandKit; autoDraw?: boolean }) {
  const [out, setOut] = useState<Output>(initial);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const started = useRef(false);
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState(false);
  const d = out.data || {};

  async function exportInstagram() {
    setErr('');
    setBusy('Making Instagram images (1080 × 1350)…');
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const css = await inlineFontCss(fontHref(brand));
      const nodes = exportRefs.current.filter(Boolean) as HTMLDivElement[];
      const zip = await slidesToZip(nodes.slice(0, IG_MAX_SLIDES), out.title, css);
      download(zip, `${slug(out.title)}-instagram.zip`);
    } catch (e: any) {
      setErr('Could not make the images: ' + (e?.message || 'unknown error'));
    } finally {
      setExporting(false);
      setBusy('');
    }
  }

  async function exportImage(w: number, h: number) {
    if (!d.imageUrl) return;
    try {
      const blob = await fitImage(d.imageUrl, w, h, brand.colors.background);
      download(blob, `${slug(out.title)}-${w}x${h}.png`);
    } catch (e: any) {
      setErr('Could not resize the image: ' + (e?.message || 'unknown error'));
    }
  }

  const exportBrand: BrandKit = { ...brand, headshotUrl: sameOrigin(brand.headshotUrl), logoUrl: sameOrigin(brand.logoUrl) };

  async function draw(target: 'image' | 'hero' | 'slide', index?: number) {
    setErr('');
    setBusy(target === 'slide' ? `Drawing slide ${index! + 1}…` : 'Drawing the image… (20 to 60 seconds)');
    try {
      const res = await fetch('/api/image', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: out.id, target, index }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setOut((o) => {
        const nd = { ...o.data };
        if (target === 'image') nd.imageUrl = j.url;
        if (target === 'hero') nd.heroUrl = j.url;
        if (target === 'slide') nd.slides = nd.slides.map((s: any, i: number) => (i === index ? { ...s, imageUrl: j.url } : s));
        return { ...o, data: nd };
      });
    } catch (e: any) {
      setErr(e.message || 'Image failed.');
    } finally {
      setBusy('');
    }
  }

  async function illustrateAll() {
    const slides = out.data.slides || [];
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].kind === 'content' && !slides[i].imageUrl) await draw('slide', i);
    }
  }

  useEffect(() => {
    if (!autoDraw || started.current) return;
    started.current = true;
    if (out.kind === 'image' && !d.imageUrl) draw('image');
    if (out.kind === 'newsletter' && !d.heroUrl && d.heroPrompt) draw('hero');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDraw]);

  const href = fontHref(brand);

  return (
    <div className="out">
      {href && <link rel="stylesheet" href={href} />}
      <div className="out-head">
        <div>
          <span className="cmd-label">{out.command === '/leadmagnet' ? 'LEAD MAGNET' : KIND_LABEL[out.kind]}</span>{' '}
          <span className="pill">{out.playbook}</span>{' '}
          {d.intent && <span className="pill">{d.intent}</span>}
          <h3>{out.title}</h3>
          <div className="muted" style={{ fontSize: 12 }}>
            {new Date(out.createdAt).toLocaleString()} · read: {out.sources.slice(0, 8).join(', ')}
            {out.sources.length > 8 ? '…' : ''}
          </div>
        </div>
        {msg && <span className="pill ok">{msg}</span>}
      </div>

      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
      {busy && (
        <div className="note row" style={{ marginBottom: 12 }}>
          <span className="spinner" /> {busy}
        </div>
      )}

      {(out.kind === 'text') && (
        <>
          <div className="post">{postText(d)}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn small" onClick={() => copy(postText(d), setMsg)}>Copy post</button>
          </div>
        </>
      )}

      {out.kind === 'answer' && (
        <div className="post">{d.answer}</div>
      )}

      {out.kind === 'carousel' && (
        <>
          <div className="slides">
            {(d.slides || []).map((s: any, i: number) => (
              <div className="slide-wrap" key={i}>
                <div>
                  <Slide slide={s} brand={brand} n={i + 1} total={d.slides.length} />
                </div>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <a className="btn small" href={`/print/${out.id}`} target="_blank">LinkedIn PDF</a>
            <button className="btn small" disabled={!!busy} onClick={exportInstagram}>Instagram images</button>
            <button className="btn small ghost" disabled={!!busy} onClick={illustrateAll}>Add AI illustrations</button>
            {d.post && <button className="btn small ghost" onClick={() => copy(d.post, setMsg)}>Copy LinkedIn post</button>}
            <button className="btn small ghost" onClick={() => copy(d.caption || '', setMsg)}>Copy {d.post ? 'Instagram caption' : 'caption'}</button>
            {d.dm && <button className="btn small ghost" onClick={() => copy(d.dm, setMsg)}>Copy DM</button>}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Every page is 1080 × 1350. LinkedIn: upload the PDF with Add a document and give it a title. Instagram: upload the images in order{(d.slides || []).length > IG_MAX_SLIDES ? ` (Instagram takes the first ${IG_MAX_SLIDES})` : ''}.
          </div>
          {d.post && <div className="post" style={{ marginTop: 12 }}>{d.post}</div>}
          {d.caption && <div className="post" style={{ marginTop: 12 }}>{d.caption}</div>}
          {exporting && (
            <div style={{ position: 'fixed', left: -20000, top: 0 }} aria-hidden>
              {(d.slides || []).map((s: any, i: number) => (
                <div key={i} ref={(el) => { exportRefs.current[i] = el; }} style={{ width: 1080, height: 1350 }}>
                  <Slide slide={{ ...s, imageUrl: s.imageUrl ? sameOrigin(s.imageUrl) : undefined }} brand={exportBrand} n={i + 1} total={d.slides.length} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {out.kind === 'image' && (
        <>
          <div className="grid2">
            <div>
              {d.imageUrl ? (
                <img src={d.imageUrl} alt={d.onImageText} style={{ width: '100%', borderRadius: 12, border: '1px solid var(--line)' }} />
              ) : (
                <div className="drop">{busy ? 'Drawing…' : 'No image yet'}</div>
              )}
            </div>
            <div className="stack">
              <div><b>On the image:</b> {d.onImageText}</div>
              <div className="muted">{d.style} · {d.shape}{d.includeFounder ? ' · with your photo' : ''}</div>
              <div className="post">{d.caption}</div>
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            {d.imageUrl && <button className="btn small" onClick={() => exportImage(1080, 1350)}>Download 4:5 (1080 × 1350)</button>}
            {d.imageUrl && <button className="btn small ghost" onClick={() => exportImage(1080, 1080)}>Square (1080 × 1080)</button>}
            <button className="btn small ghost" disabled={!!busy} onClick={() => draw('image')}>{d.imageUrl ? 'Redraw' : 'Draw image'}</button>
            <button className="btn small ghost" onClick={() => copy(d.caption || '', setMsg)}>Copy caption</button>
          </div>
        </>
      )}

      {out.kind === 'newsletter' && (
        <>
          {d.heroUrl && <img src={d.heroUrl} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 12 }} />}
          <p style={{ marginTop: 12 }}><b>Subject:</b> {d.subject}<br /><span className="muted">Preheader: {d.preheader}</span></p>
          <div className="post">{newsletterText(d)}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn small" onClick={() => copy(newsletterText(d), setMsg)}>Copy text</button>
            <button className="btn small ghost" onClick={() => copy(newsletterHtml(d, brand), setMsg)}>Copy email HTML</button>
            <button className="btn small ghost" disabled={!!busy} onClick={() => draw('hero')}>{d.heroUrl ? 'Redraw header' : 'Draw header'}</button>
          </div>
        </>
      )}

      {out.kind === 'reel' && (
        <>
          <p><b>{d.platform}</b> · {d.seconds} seconds · <b>Hook:</b> {d.hook}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}><th>Beat</th><th>Say</th><th>On screen</th><th>Shot</th></tr></thead>
            <tbody>
              {(d.beats || []).map((b: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--line)', verticalAlign: 'top' }}>
                  <td style={{ padding: 8, fontWeight: 600 }}>{b.label}</td><td style={{ padding: 8 }}>{b.say}</td><td style={{ padding: 8 }}>{b.onScreen}</td><td style={{ padding: 8 }} className="muted">{b.shot}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 10 }}><b>CTA:</b> {d.cta}</p>
          <div className="row">
            <button className="btn small" onClick={() => copy([d.hook, ...(d.beats || []).map((b: any) => b.say), d.cta].join('\n\n'), setMsg)}>Copy script</button>
            <button className="btn small ghost" onClick={() => copy(d.caption || '', setMsg)}>Copy caption</button>
          </div>
        </>
      )}

      {out.kind === 'video' && (
        <>
          <p><b>{d.format}</b> · about {d.minutes} minutes</p>
          <div className="post">
            {[`COLD OPEN\n${d.coldOpen}`, ...(d.chapters || []).map((c: any, i: number) => `${i + 1}. ${c.title}\n${c.script}${c.bRoll ? `\n[B-roll: ${c.bRoll}]` : ''}`), `CTA\n${d.cta}`].join('\n\n')}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn small" onClick={() => copy([d.coldOpen, ...(d.chapters || []).map((c: any) => `${c.title}\n${c.script}`), d.cta].join('\n\n'), setMsg)}>Copy script</button>
            <button className="btn small ghost" onClick={() => copy(d.description || '', setMsg)}>Copy description</button>
          </div>
        </>
      )}
    </div>
  );
}

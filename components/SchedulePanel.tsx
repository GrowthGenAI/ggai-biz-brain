'use client';
import { useState } from 'react';
import Link from 'next/link';
import { fitImage, slidesToJpegs, slidesToPdf, slug, uploadFile } from '@/lib/formats';
import type { BrandKit, Output } from '@/lib/types';
import { formatPost } from '@/lib/postformat';

const IG_API_MAX = 10;

function todayIndia() {
  return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
}

function tomorrowIndia() {
  return new Date(Date.now() + 5.5 * 3600e3 + 864e5).toISOString().slice(0, 10);
}

/**
 * Approve a post for LinkedIn and/or Instagram: post it now, or put it in the
 * Planner on a date. Nothing is posted without pressing one of these buttons.
 */
export default function SchedulePanel({
  out,
  brand,
  defaultLinkedIn,
  defaultCaption,
  getSlides,
}: {
  out: Output;
  brand: BrandKit;
  defaultLinkedIn: string;
  defaultCaption: string;
  getSlides?: () => Promise<{ nodes: HTMLElement[]; css: string; done: () => void }>;
}) {
  const d = out.data || {};
  const igPossible = out.kind === 'carousel' || (out.kind === 'image' && !!d.imageUrl);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(tomorrowIndia());
  const [useLi, setUseLi] = useState(true);
  const [useIg, setUseIg] = useState(igPossible);
  const [liText, setLiText] = useState(() => formatPost(defaultLinkedIn));
  const [docTitle, setDocTitle] = useState(out.title);
  const [igText, setIgText] = useState(() => formatPost(defaultCaption));
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<any>(null);

  if (!['text', 'carousel', 'image'].includes(out.kind)) return null;

  async function go(postNow: boolean) {
    setErr('');
    setDone(null);
    if (!useLi && !useIg) return setErr('Tick LinkedIn or Instagram.');
    if (out.kind === 'image' && !d.imageUrl) return setErr('Draw the image first.');
    try {
      const body: any = { action: 'add', outputId: out.id, date: postNow ? todayIndia() : date, postNow };
      const name = slug(out.title);
      if (out.kind === 'carousel' && getSlides) {
        setBusy('Preparing the slides…');
        const { nodes, css, done: finish } = await getSlides();
        try {
          if (useLi) {
            setBusy('Making the LinkedIn PDF (1080 × 1350 pages)…');
            const pdf = await slidesToPdf(nodes, docTitle || out.title, css);
            if (pdf.size > 4 * 1024 * 1024) throw new Error('The PDF is over 4 MB. Remove AI illustrations from a few slides and try again.');
            const fileUrl = await uploadFile(pdf, `${name}.pdf`);
            body.linkedin = { text: liText, docTitle: docTitle || out.title, fileUrl, fileType: 'pdf' };
          }
          if (useIg) {
            setBusy('Making the Instagram images…');
            const jpgs = await slidesToJpegs(nodes.slice(0, IG_API_MAX), css);
            const imageUrls: string[] = [];
            for (let i = 0; i < jpgs.length; i++) {
              setBusy(`Saving Instagram image ${i + 1} of ${jpgs.length}…`);
              imageUrls.push(await uploadFile(jpgs[i], `${name}-${String(i + 1).padStart(2, '0')}.jpg`));
            }
            body.instagram = { caption: igText, imageUrls };
          }
        } finally {
          finish();
        }
      } else if (out.kind === 'image') {
        setBusy('Fitting the image to 1080 × 1350…');
        const jpg = await fitImage(d.imageUrl, 1080, 1350, brand.colors.background, 'image/jpeg');
        const url = await uploadFile(jpg, `${name}-1080x1350.jpg`);
        if (useLi) body.linkedin = { text: liText, fileUrl: url, fileType: 'image' };
        if (useIg) body.instagram = { caption: igText, imageUrls: [url] };
      } else if (useLi) {
        body.linkedin = { text: liText };
      }
      setBusy(postNow ? 'Posting… (up to a minute)' : 'Adding to the Planner…');
      const res = await fetch('/api/planner', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Could not save.');
      setDone(j.row);
    } catch (e: any) {
      setErr(e.message || 'Something went wrong.');
    } finally {
      setBusy('');
    }
  }

  if (!open) {
    return (
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn small amber" onClick={() => setOpen(true)}>Approve &amp; schedule</button>
        <span className="muted" style={{ fontSize: 12 }}>Post to LinkedIn{igPossible ? ' and Instagram' : ''} now or on a date</span>
      </div>
    );
  }

  const status = (p?: any) => (p ? (p.status === 'posted' ? '✓ posted' : p.status === 'failed' ? `✗ ${p.error}` : `scheduled for ${done.date}`) : '');

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h3 style={{ marginTop: 0 }}>Approve &amp; schedule</h3>
      <div className="row" style={{ flexWrap: 'wrap', gap: 16 }}>
        <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={useLi} onChange={(e) => setUseLi(e.target.checked)} /> LinkedIn</label>
        <label className="row" style={{ gap: 6, opacity: igPossible ? 1 : 0.5 }}>
          <input type="checkbox" disabled={!igPossible} checked={useIg} onChange={(e) => setUseIg(e.target.checked)} /> Instagram
          {!igPossible && <span className="muted" style={{ fontSize: 12 }}>(needs an image)</span>}
        </label>
        <label className="row" style={{ gap: 6 }}>Date <input className="in" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 170 }} /></label>
      </div>

      {useLi && (
        <>
          {out.kind === 'carousel' && (
            <label className="f">Document title (shown on LinkedIn)<input className="in" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} /></label>
          )}
          <label className="f">LinkedIn post <span className="h">{liText.length} / 3,000</span>
            <textarea className="in" rows={8} value={liText} onChange={(e) => setLiText(e.target.value)} />
          </label>
        </>
      )}
      {useIg && (
        <label className="f">Instagram caption <span className="h">{igText.length} / 2,200{out.kind === 'carousel' && (d.slides || []).length > IG_API_MAX ? ` · Instagram posts the first ${IG_API_MAX} slides` : ''}</span>
          <textarea className="in" rows={6} value={igText} onChange={(e) => setIgText(e.target.value)} />
        </label>
      )}

      {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}
      {busy && <div className="note row" style={{ marginBottom: 10 }}><span className="spinner" /> {busy}</div>}
      {done && (
        <div className="note" style={{ marginBottom: 10 }}>
          {done.linkedin && <div>LinkedIn: {status(done.linkedin)} {done.linkedin.url && <a href={done.linkedin.url} target="_blank">open</a>}</div>}
          {done.instagram && <div>Instagram: {status(done.instagram)} {done.instagram.url && <a href={done.instagram.url} target="_blank">open</a>}</div>}
          <Link href="/planner">See the Planner →</Link>
        </div>
      )}

      <div className="row">
        <button className="btn small" disabled={!!busy} onClick={() => go(false)}>Schedule for {date}</button>
        <button className="btn small amber" disabled={!!busy} onClick={() => go(true)}>Post now</button>
        <button className="btn small ghost" disabled={!!busy} onClick={() => setOpen(false)}>Close</button>
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Scheduled posts go out at about 9 AM India time on their date. Connect your accounts in the Planner.</div>
    </div>
  );
}

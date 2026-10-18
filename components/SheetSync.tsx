'use client';
import { useRef, useState } from 'react';
import Slide, { fontHref } from '@/components/Slide';
import { inlineFontCss, sameOrigin, slidesToJpegs, slidesToPdf, slug, uploadFile } from '@/lib/formats';
import type { BrandKit, CarouselSlide } from '@/lib/types';

type Row = Record<string, string> & { row: number };

/** "Slide 1 || Slide 2 || ..." from the sheet → carousel slides in the dashboard's format. */
export function toSlides(raw: string): CarouselSlide[] {
  const parts = String(raw || '').split('||').map((s) => s.trim()).filter(Boolean);
  return parts.map((t, i) => {
    if (i === 0) return { kind: 'cover', heading: t };
    if (i === parts.length - 1) return { kind: 'cta', heading: t };
    const m = t.match(/^(.{6,90}?)[:.]\s+(.+)$/);
    return m ? { kind: 'content', heading: m[1].trim(), body: m[2].trim() } : { kind: 'content', heading: t };
  });
}

function onImageText(r: Row) {
  const m = String(r['Image idea'] || '').match(/text:\s*["“]([^"”]+)["”]/i);
  return (m ? m[1] : r.Hook || r.Topic || '').trim();
}

/**
 * Bring every Approved row of the content sheet into the Planner: designs carousels and
 * image cards in the Brand Kit, then schedules them on the row's date. Text posts go in as they are.
 */
export default function SheetSync({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [setup, setSetup] = useState<{ script: string } | null>(null);
  const [render, setRender] = useState<{ slides: CarouselSlide[]; brand: BrandKit } | null>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  async function draw(slides: CarouselSlide[], brand: BrandKit) {
    refs.current = [];
    setRender({ slides, brand });
    await new Promise((r) => setTimeout(r, 700));
    const css = await inlineFontCss(fontHref(brand));
    const nodes = refs.current.slice(0, slides.length).filter(Boolean) as HTMLDivElement[];
    return { nodes, css };
  }

  async function post(url: string, body: object) {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json();
    if (!res.ok || j.error) throw new Error(j.error || 'Could not save.');
    return j;
  }

  async function sync() {
    setErr('');
    setLog([]);
    setBusy('Reading the content sheet…');
    const add = (s: string) => setLog((l) => [...l, s]);
    try {
      const j = await fetch('/api/sheet').then((r) => r.json());
      if (!j.configured) { setSetup({ script: j.script }); return; }
      if (j.error) throw new Error(j.error);
      const rows: Row[] = j.rows || [];
      if (!rows.length) { add('No rows marked Approved. Set Status to Approved in the sheet, then press Sync again.'); return; }
      const brand: BrandKit = await fetch('/api/brand').then((r) => r.json());
      const exportBrand = { ...brand, headshotUrl: sameOrigin(brand.headshotUrl), logoUrl: sameOrigin(brand.logoUrl) };

      for (const r of rows) {
        const fmt = String(r.Format || '').toLowerCase();
        const title = r.Topic || r.Hook || `Sheet row ${r.row}`;
        const text = r['Full text / caption'] || '';
        const toLi = /linkedin/i.test(r.Platform || 'LinkedIn');
        const toIg = /instagram/i.test(r.Platform || '');
        setBusy(`Row ${r.row}: ${title}…`);
        try {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(r.Date || '')) throw new Error('the Date cell needs a date like 2026-10-19');
          if (fmt.includes('reel') || fmt.includes('video')) {
            await post('/api/sheet', { action: 'mark', row: r.row, fields: { Status: 'Script ready', Notes: 'Reel script: make the video, then post it by hand.' } });
            add(`Row ${r.row}: reel script, marked Script ready (videos are not posted automatically).`);
            continue;
          }
          if (fmt.includes('newsletter')) {
            await post('/api/sheet', { action: 'mark', row: r.row, fields: { Status: 'Ready to paste', Notes: 'Newsletter: paste it into your LinkedIn newsletter by hand.' } });
            add(`Row ${r.row}: newsletter, marked Ready to paste.`);
            continue;
          }
          const name = slug(title);
          const body: any = { action: 'add', date: r.Date, sheetRow: r.row };

          if (fmt.includes('carousel')) {
            const slides = toSlides(r.Slides);
            if (slides.length < 3) throw new Error('a carousel needs at least 3 slides in the Slides cell, split with ||');
            const out = await post('/api/sheet', { action: 'output', row: r.row, kind: 'carousel', title, data: { slides, post: text, caption: text } });
            const { nodes, css } = await draw(slides, exportBrand);
            if (toLi) {
              setBusy(`Row ${r.row}: making the LinkedIn PDF…`);
              const pdf = await slidesToPdf(nodes, title, css);
              if (pdf.size > 4 * 1024 * 1024) throw new Error('the PDF is over 4 MB');
              body.linkedin = { text, docTitle: title, fileUrl: await uploadFile(pdf, `${name}.pdf`), fileType: 'pdf' };
            }
            if (toIg) {
              setBusy(`Row ${r.row}: making the Instagram images…`);
              const jpgs = await slidesToJpegs(nodes.slice(0, 10), css);
              const imageUrls: string[] = [];
              for (let i = 0; i < jpgs.length; i++) imageUrls.push(await uploadFile(jpgs[i], `${name}-${String(i + 1).padStart(2, '0')}.jpg`));
              body.instagram = { caption: text, imageUrls };
            }
            body.outputId = out.id;
          } else if (fmt.includes('image')) {
            const slides: CarouselSlide[] = [{ kind: 'cover', heading: onImageText(r) }];
            const { nodes, css } = await draw(slides, exportBrand);
            setBusy(`Row ${r.row}: making the image…`);
            const [jpg] = await slidesToJpegs(nodes, css);
            const url = await uploadFile(jpg, `${name}-1080x1350.jpg`);
            const out = await post('/api/sheet', { action: 'output', row: r.row, kind: 'image', title, data: { imageUrl: url, onImageText: onImageText(r), post: text, caption: text } });
            if (toLi) body.linkedin = { text, fileUrl: url, fileType: 'image' };
            if (toIg) body.instagram = { caption: text, imageUrls: [url] };
            body.outputId = out.id;
          } else {
            const out = await post('/api/sheet', { action: 'output', row: r.row, kind: 'text', title, data: { post: text } });
            body.linkedin = { text };
            body.outputId = out.id;
          }
          if (!body.linkedin && !body.instagram) throw new Error('the Platform cell needs LinkedIn and/or Instagram');
          await post('/api/planner', body);
          add(`Row ${r.row}: scheduled for ${r.Date}.`);
        } catch (e: any) {
          add(`Row ${r.row}: not scheduled, ${e.message || 'something went wrong'}.`);
          await post('/api/sheet', { action: 'mark', row: r.row, fields: { Error: String(e.message || 'Could not schedule') } }).catch(() => {});
        } finally {
          setRender(null);
        }
      }
      onDone();
    } catch (e: any) {
      setErr(e.message || 'Something went wrong.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0 }}>Content sheet</h3>
          <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
            Set rows to <b>Approved</b> in your Google Sheet, then press Sync. Carousels and image cards are designed in your Brand Kit and scheduled on their date. The sheet shows Scheduled, then Posted with the link.
          </p>
        </div>
        <button className="btn small amber" disabled={!!busy} onClick={sync}>Sync approved rows</button>
      </div>
      {busy && <p className="row muted" style={{ fontSize: 13 }}><span className="spinner" /> {busy}</p>}
      {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
      {!!log.length && <ul style={{ fontSize: 13, margin: '10px 0 0', paddingLeft: 18 }}>{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
      {setup && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <p style={{ margin: '0 0 6px' }}><b>Connect your sheet once (5 minutes):</b></p>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>Open the content sheet → Extensions → Apps Script. Delete what is there and paste the code below.</li>
            <li>On the first line, replace PASTE-THE-SAME-WORD-AS-SHEET_TOKEN with a long random word.</li>
            <li>Deploy → New deployment → type Web app → Execute as: Me → Who has access: Anyone → Deploy → Allow. Copy the Web app URL.</li>
            <li>Vercel → this project → Settings → Environments → Production → add SHEET_SCRIPT_URL (the URL) and SHEET_TOKEN (the same word), type Secret → Redeploy.</li>
          </ol>
          <textarea className="in" readOnly rows={8} value={setup.script} style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }} />
        </div>
      )}
      {render && (
        <div style={{ position: 'fixed', left: -20000, top: 0 }} aria-hidden>
          {render.slides.map((s, i) => (
            <div key={i} ref={(el) => { refs.current[i] = el; }} style={{ width: 1080, height: 1350 }}>
              <Slide slide={s} brand={render.brand} n={i + 1} total={render.slides.length} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import JSZip from 'jszip';
import { toJpeg, toPng } from 'html-to-image';
import { PDFDocument } from 'pdf-lib';

/*
 * Platform formats used everywhere in GGAI Business Brain.
 * LinkedIn carousel / document post: ONE PDF, every page 1080 x 1350.
 * Instagram carousel: up to 20 images, each 1080 x 1350 (4:5).
 * Single image post: 1080 x 1350 portrait (both platforms) or 1080 x 1080 square.
 */
export const SLIDE = { w: 1080, h: 1350 };
export const IG_MAX_SLIDES = 20;

export function sameOrigin(url: string) {
  if (!url || url.startsWith('/') || url.startsWith('data:')) return url;
  return `/api/img?u=${encodeURIComponent(url)}`;
}

async function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(b);
  });
}

/** Google Fonts CSS with every font file inlined, so exported images keep the brand fonts. */
export async function inlineFontCss(href: string): Promise<string> {
  if (!href) return '';
  try {
    let css = await (await fetch(href)).text();
    const urls = Array.from(new Set(Array.from(css.matchAll(/url\((https:[^)]+)\)/g)).map((m) => m[1])));
    for (const u of urls) {
      const data = await blobToDataUrl(await (await fetch(u)).blob());
      css = css.split(u).join(data);
    }
    return css;
  } catch {
    return '';
  }
}

export function slug(s: string) {
  return (s || 'carousel').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'carousel';
}

/** Turn rendered full-size slide nodes into a zip of 1080 x 1350 PNGs (Instagram carousel). */
export async function slidesToZip(nodes: HTMLElement[], title: string, fontEmbedCSS: string): Promise<Blob> {
  const zip = new JSZip();
  for (let i = 0; i < nodes.length; i++) {
    const dataUrl = await toPng(nodes[i], { width: SLIDE.w, height: SLIDE.h, pixelRatio: 1, cacheBust: true, fontEmbedCSS: fontEmbedCSS || undefined });
    zip.file(`${String(i + 1).padStart(2, '0')}-${slug(title)}.png`, dataUrl.split(',')[1], { base64: true });
  }
  return zip.generateAsync({ type: 'blob' });
}

/** Fit any image onto an exact canvas without stretching or cutting it: the rest is filled with the brand background. */
export async function fitImage(src: string, w: number, h: number, bg: string, type: 'image/png' | 'image/jpeg' = 'image/png'): Promise<Blob> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = sameOrigin(src);
  await img.decode();
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg || '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return new Promise((resolve) => c.toBlob((b) => resolve(b!), type, 0.92));
}

export function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/** Turn rendered full-size slide nodes into one LinkedIn document PDF: every page 1080 x 1350. */
export async function slidesToPdf(nodes: HTMLElement[], title: string, fontEmbedCSS: string): Promise<Blob> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  for (const node of nodes) {
    const dataUrl = await toJpeg(node, { width: SLIDE.w, height: SLIDE.h, pixelRatio: 1, quality: 0.92, cacheBust: true, fontEmbedCSS: fontEmbedCSS || undefined });
    const img = await pdf.embedJpg(dataUrl);
    // 1080 x 1350 px = 810 x 1012.5 pt, the same size as the print version
    const page = pdf.addPage([810, 1012.5]);
    page.drawImage(img, { x: 0, y: 0, width: 810, height: 1012.5 });
  }
  const bytes = await pdf.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

/** One JPEG per slide (Instagram's publishing API only takes JPEG). */
export async function slidesToJpegs(nodes: HTMLElement[], fontEmbedCSS: string): Promise<Blob[]> {
  const out: Blob[] = [];
  for (const node of nodes) {
    const dataUrl = await toJpeg(node, { width: SLIDE.w, height: SLIDE.h, pixelRatio: 1, quality: 0.92, cacheBust: true, fontEmbedCSS: fontEmbedCSS || undefined });
    out.push(await (await fetch(dataUrl)).blob());
  }
  return out;
}

/** Save a file to the dashboard's storage and get its public link back. */
export async function uploadFile(blob: Blob, name: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', new File([blob], name, { type: blob.type }));
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || 'Upload failed.');
  return j.url;
}

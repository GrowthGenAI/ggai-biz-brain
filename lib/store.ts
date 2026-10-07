import { put, list, del } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

/*
 * Storage. On Vercel it uses your Blob store (BLOB_READ_WRITE_TOKEN is added
 * automatically when you connect one). On your own laptop it falls back to a
 * local .data folder so you can try the app without any cloud setup.
 */

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL = path.join(process.cwd(), '.data');

export function storageMode() {
  return useBlob() ? 'blob' : 'local';
}

async function localWrite(key: string, body: Buffer | string) {
  const file = path.join(LOCAL, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
}

async function localRead(key: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(LOCAL, key));
  } catch {
    return null;
  }
}

/** Read a JSON document stored under `key` (a folder-like name, e.g. "brain/vault"). */
export async function readJSON<T>(key: string): Promise<T | null> {
  if (!useBlob()) {
    const buf = await localRead(`${key}/data.json`);
    return buf ? (JSON.parse(buf.toString('utf8')) as T) : null;
  }
  const { blobs } = await list({ prefix: `${key}/` });
  if (!blobs.length) return null;
  const newest = blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))[0];
  const res = await fetch(newest.url, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** Replace the JSON document stored under `key`. */
export async function writeJSON(key: string, data: unknown): Promise<void> {
  const body = JSON.stringify(data);
  if (!useBlob()) {
    await localWrite(`${key}/data.json`, body);
    return;
  }
  const { blobs: old } = await list({ prefix: `${key}/` });
  await put(`${key}/data.json`, body, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'application/json',
  });
  if (old.length) await del(old.map((b) => b.url));
}

/** Save an image or file and return a URL the browser can load. */
export async function saveMedia(buf: Buffer, ext: string, contentType: string): Promise<string> {
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  if (!useBlob()) {
    await localWrite(`media/${name}`, buf);
    return `/api/media/${name}`;
  }
  const blob = await put(`brain/media/${name}`, buf, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
  });
  return blob.url;
}

export async function readLocalMedia(name: string) {
  if (!/^[\w.-]+$/.test(name)) return null;
  return localRead(`media/${name}`);
}

/** Load bytes for a media URL (Blob URL or local /api/media URL). */
export async function loadMedia(url: string): Promise<Buffer | null> {
  if (!url) return null;
  if (url.startsWith('/api/media/')) return readLocalMedia(url.replace('/api/media/', ''));
  const res = await fetch(url);
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

import crypto from 'crypto';
import { readJSON, writeJSON } from './store';

/* Social account tokens are stored encrypted with a key made from APP_PASSWORD. */

function key() {
  return crypto.createHash('sha256').update(`${process.env.APP_PASSWORD || ''}:social-token:v1`).digest();
}

function seal(text: string) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

function open(sealed: string) {
  const [iv, tag, enc] = sealed.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

export async function saveSecret(name: string, value: unknown) {
  await writeJSON(`brain/accounts/${name}`, { sealed: seal(JSON.stringify(value)) });
}

export async function getSecret<T>(name: string): Promise<T | null> {
  const s = await readJSON<{ sealed?: string }>(`brain/accounts/${name}`);
  if (!s?.sealed) return null;
  try {
    return JSON.parse(open(s.sealed)) as T;
  } catch {
    return null;
  }
}

export async function clearSecret(name: string) {
  await writeJSON(`brain/accounts/${name}`, {});
}

export function stateCookie(req: Request, name: string) {
  return req.headers.get('cookie')?.match(new RegExp(`(?:^|; )${name}=([^;]+)`))?.[1];
}

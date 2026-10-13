import { clearSecret, getSecret, saveSecret } from './secure';

/*
 * LinkedIn posting for one member account (the founder who owns this dashboard).
 * Uses LinkedIn's own "Share on LinkedIn" product. Posts go out only when the
 * founder approves them (post now, or scheduled in the Planner).
 */

export type LinkedInAccount = { token: string; expiresAt: string; sub: string; name: string };

export function redirectUri(origin: string) {
  return `${origin}/api/linkedin/callback`;
}

export function linkedinConfigured() {
  return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

export async function saveAccount(a: LinkedInAccount) {
  await saveSecret('linkedin', a);
}

export async function getAccount() {
  return getSecret<LinkedInAccount>('linkedin');
}

export async function clearAccount() {
  await clearSecret('linkedin');
}

/** LinkedIn API versions are monthly (YYYYMM) and retire after about a year: try recent ones. */
function versions() {
  const out: string[] = [];
  if (process.env.LINKEDIN_VERSION) out.push(process.env.LINKEDIN_VERSION);
  const d = new Date();
  for (let i = 1; i <= 8; i++) {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    out.push(`${m.getUTCFullYear()}${String(m.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return Array.from(new Set(out));
}

let goodVersion = '';

async function rest(token: string, path: string, init: RequestInit = {}) {
  const tryList = goodVersion ? [goodVersion, ...versions().filter((v) => v !== goodVersion)] : versions();
  let last: Response | null = null;
  for (const v of tryList) {
    const res = await fetch(`https://api.linkedin.com/rest/${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'LinkedIn-Version': v,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (res.status === 426 || (res.status === 400 && (await res.clone().text()).includes('VERSION'))) {
      last = res;
      continue;
    }
    goodVersion = v;
    return res;
  }
  return last!;
}

async function fail(res: Response, what: string): Promise<never> {
  const t = await res.text().catch(() => '');
  if (res.status === 401) throw new Error('LinkedIn says the connection has expired. Open Planner and press Connect LinkedIn again.');
  if (res.status === 403) throw new Error(`LinkedIn refused to ${what}. Check the app has "Share on LinkedIn" added under Products. (${t.slice(0, 200)})`);
  throw new Error(`LinkedIn could not ${what} (${res.status}). ${t.slice(0, 300)}`);
}

/** Upload a PDF (document) or an image and wait until LinkedIn has processed it. */
export async function uploadMedia(a: LinkedInAccount, kind: 'documents' | 'images', bytes: Buffer, contentType: string) {
  const init = await rest(a.token, `${kind}?action=initializeUpload`, {
    method: 'POST',
    body: JSON.stringify({ initializeUploadRequest: { owner: `urn:li:person:${a.sub}` } }),
  });
  if (!init.ok) await fail(init, kind === 'documents' ? 'start the document upload' : 'start the image upload');
  const v = (await init.json()).value;
  const urn: string = v.document || v.image;
  const put = await fetch(v.uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${a.token}`, 'Content-Type': contentType },
    body: new Uint8Array(bytes),
  });
  if (!put.ok) await fail(put, 'receive the file');
  for (let i = 0; i < 12; i++) {
    const s = await rest(a.token, `${kind}/${encodeURIComponent(urn)}`);
    if (s.ok) {
      const status = (await s.json()).status;
      if (status === 'AVAILABLE') return urn;
      if (status === 'PROCESSING_FAILED') throw new Error('LinkedIn could not process the file. Try making it again.');
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return urn; // still processing: LinkedIn usually accepts the post anyway
}

/** LinkedIn post text uses a little markup language: escape its special characters, keep #hashtags. */
export function liText(text: string) {
  return String(text || '')
    .replace(/[\\|{}@\[\]()<>*_~]/g, (c) => `\\${c}`)
    .replace(/#(\w+)?/g, (_m, tag) => (tag ? `{hashtag|\\#|${tag}}` : '\\#'));
}

export async function createPost(a: LinkedInAccount, text: string, media?: { id: string; title?: string }) {
  const body: any = {
    author: `urn:li:person:${a.sub}`,
    commentary: liText(text),
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };
  if (media) body.content = { media: { id: media.id, ...(media.title ? { title: media.title } : {}) } };
  const res = await rest(a.token, 'posts', { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) await fail(res, 'publish the post');
  const urn = res.headers.get('x-restli-id') || res.headers.get('x-linkedin-id') || '';
  return urn ? `https://www.linkedin.com/feed/update/${urn}/` : '';
}

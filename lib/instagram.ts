import { clearSecret, getSecret, saveSecret } from './secure';

/*
 * Instagram posting for one professional (Business or Creator) account, using
 * Meta's "Instagram API with Instagram Login". Posts go out only when the
 * founder approves them. Images must be public JPEG URLs (our Blob store).
 */

export type InstagramAccount = { token: string; expiresAt: string; refreshedAt: string; userId: string; username: string };

const G = 'https://graph.instagram.com';
export const IG_API_MAX_ITEMS = 10; // the API takes up to 10 images per carousel

export function igRedirectUri(origin: string) {
  return `${origin}/api/instagram/callback`;
}

export function instagramConfigured() {
  return !!(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET);
}

export const saveIgAccount = (a: InstagramAccount) => saveSecret('instagram', a);
export const getIgAccount = () => getSecret<InstagramAccount>('instagram');
export const clearIgAccount = () => clearSecret('instagram');

async function j(res: Response, what: string) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const m = body.error?.message || body.error_message || res.status;
    if (res.status === 401 || body.error?.code === 190) throw new Error('Instagram says the connection has expired. Open Planner and press Connect Instagram again.');
    throw new Error(`Instagram could not ${what}: ${m}`);
  }
  return body;
}

/** Swap the login code for a 60-day token and read the account name. */
export async function connectWithCode(code: string, origin: string): Promise<InstagramAccount> {
  const short = await j(
    await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID || '',
        client_secret: process.env.INSTAGRAM_APP_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: igRedirectUri(origin),
        code,
      }),
    }),
    'accept the app details',
  );
  const long = await j(
    await fetch(`${G}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(process.env.INSTAGRAM_APP_SECRET || '')}&access_token=${encodeURIComponent(short.access_token)}`),
    'make a long-lasting connection',
  );
  const me = await j(await fetch(`${G}/me?fields=user_id,username&access_token=${encodeURIComponent(long.access_token)}`), 'read your account');
  const now = Date.now();
  return {
    token: long.access_token,
    expiresAt: new Date(now + (Number(long.expires_in) || 5184000) * 1000).toISOString(),
    refreshedAt: new Date(now).toISOString(),
    userId: String(me.user_id || me.id || short.user_id),
    username: me.username || '',
  };
}

/** Tokens last 60 days; refresh once a week so the connection never lapses. */
export async function refreshIfOld(a: InstagramAccount) {
  if (Date.now() - +new Date(a.refreshedAt) < 7 * 864e5) return a;
  try {
    const r = await j(await fetch(`${G}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(a.token)}`), 'refresh');
    const next = { ...a, token: r.access_token, refreshedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + (Number(r.expires_in) || 5184000) * 1000).toISOString() };
    await saveIgAccount(next);
    return next;
  } catch {
    return a;
  }
}

async function container(a: InstagramAccount, params: Record<string, string>) {
  const body = await j(
    await fetch(`${G}/${a.userId}/media`, { method: 'POST', body: new URLSearchParams({ ...params, access_token: a.token }) }),
    'prepare the image',
  );
  return String(body.id);
}

async function waitReady(a: InstagramAccount, id: string) {
  for (let i = 0; i < 15; i++) {
    const s = await j(await fetch(`${G}/${id}?fields=status_code&access_token=${encodeURIComponent(a.token)}`), 'check the upload');
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error('Instagram could not process an image. Make sure each image is a JPEG under 8 MB.');
    await new Promise((r) => setTimeout(r, 2000));
  }
}

/** Publish one image or a carousel (2 to 10 images). Returns the post link. */
export async function publishInstagram(a: InstagramAccount, imageUrls: string[], caption: string) {
  const urls = imageUrls.slice(0, IG_API_MAX_ITEMS);
  if (!urls.length) throw new Error('No images to post on Instagram.');
  if (caption.length > 2200) throw new Error(`Instagram allows 2,200 characters in a caption. This one has ${caption.length}.`);
  let creation: string;
  if (urls.length === 1) {
    creation = await container(a, { image_url: urls[0], caption });
  } else {
    const children: string[] = [];
    for (const u of urls) children.push(await container(a, { image_url: u, is_carousel_item: 'true' }));
    for (const c of children) await waitReady(a, c);
    creation = await container(a, { media_type: 'CAROUSEL', children: children.join(','), caption });
  }
  await waitReady(a, creation);
  const pub = await j(
    await fetch(`${G}/${a.userId}/media_publish`, { method: 'POST', body: new URLSearchParams({ creation_id: creation, access_token: a.token }) }),
    'publish the post',
  );
  const link = await fetch(`${G}/${pub.id}?fields=permalink&access_token=${encodeURIComponent(a.token)}`).then((r) => r.json()).catch(() => ({}));
  return String(link.permalink || '');
}

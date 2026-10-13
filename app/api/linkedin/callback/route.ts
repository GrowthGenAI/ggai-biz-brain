import { NextResponse } from 'next/server';
import { redirectUri, saveAccount } from '@/lib/linkedin';
import { stateCookie } from '@/lib/secure';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const origin = u.origin;
  const back = (q: string) => NextResponse.redirect(`${origin}/planner?${q}`);
  const cookieState = stateCookie(req, 'li_state');
  if (u.searchParams.get('error')) return back(`error=${encodeURIComponent(u.searchParams.get('error_description') || 'LinkedIn connection was cancelled.')}`);
  if (!u.searchParams.get('code') || !cookieState || cookieState !== u.searchParams.get('state')) {
    return back(`error=${encodeURIComponent('The LinkedIn connection expired. Please press Connect LinkedIn again.')}`);
  }
  const tok = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: u.searchParams.get('code')!,
      redirect_uri: redirectUri(origin),
      client_id: process.env.LINKEDIN_CLIENT_ID || '',
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
    }),
  });
  const t = await tok.json().catch(() => ({}));
  if (!tok.ok || !t.access_token) return back(`error=${encodeURIComponent('LinkedIn did not accept the app details: ' + (t.error_description || tok.status))}`);
  const me = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${t.access_token}` } });
  const m = await me.json().catch(() => ({}));
  if (!me.ok || !m.sub) return back(`error=${encodeURIComponent('Connected, but LinkedIn did not share your profile. Check "Sign In with LinkedIn using OpenID Connect" is added under Products.')}`);
  await saveAccount({
    token: t.access_token,
    expiresAt: new Date(Date.now() + (Number(t.expires_in) || 5184000) * 1000).toISOString(),
    sub: m.sub,
    name: m.name || [m.given_name, m.family_name].filter(Boolean).join(' '),
  });
  const res = back('connected=linkedin');
  res.cookies.delete('li_state');
  return res;
}

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { linkedinConfigured, redirectUri } from '@/lib/linkedin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!linkedinConfigured()) {
    return NextResponse.redirect(`${origin}/planner?error=${encodeURIComponent('Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in Vercel → Settings → Environment Variables, then redeploy.')}`);
  }
  const state = crypto.randomBytes(16).toString('hex');
  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.LINKEDIN_CLIENT_ID!);
  url.searchParams.set('redirect_uri', redirectUri(origin));
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'openid profile w_member_social');
  const res = NextResponse.redirect(url.toString());
  res.cookies.set('li_state', state, { httpOnly: true, sameSite: 'lax', secure: origin.startsWith('https'), path: '/', maxAge: 600 });
  return res;
}

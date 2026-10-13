import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { igRedirectUri, instagramConfigured } from '@/lib/instagram';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!instagramConfigured()) {
    return NextResponse.redirect(`${origin}/planner?error=${encodeURIComponent('Add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET in Vercel → Settings → Environment Variables, then redeploy.')}`);
  }
  const state = crypto.randomBytes(16).toString('hex');
  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.searchParams.set('client_id', process.env.INSTAGRAM_APP_ID!);
  url.searchParams.set('redirect_uri', igRedirectUri(origin));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'instagram_business_basic,instagram_business_content_publish');
  url.searchParams.set('state', state);
  const res = NextResponse.redirect(url.toString());
  res.cookies.set('ig_state', state, { httpOnly: true, sameSite: 'lax', secure: origin.startsWith('https'), path: '/', maxAge: 600 });
  return res;
}

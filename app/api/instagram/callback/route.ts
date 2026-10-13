import { NextResponse } from 'next/server';
import { connectWithCode, saveIgAccount } from '@/lib/instagram';
import { stateCookie } from '@/lib/secure';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const back = (q: string) => NextResponse.redirect(`${u.origin}/planner?${q}`);
  if (u.searchParams.get('error')) return back(`error=${encodeURIComponent(u.searchParams.get('error_description') || 'Instagram connection was cancelled.')}`);
  const code = (u.searchParams.get('code') || '').replace(/#_$/, '');
  if (!code || stateCookie(req, 'ig_state') !== u.searchParams.get('state')) {
    return back(`error=${encodeURIComponent('The Instagram connection expired. Please press Connect Instagram again.')}`);
  }
  try {
    await saveIgAccount(await connectWithCode(code, u.origin));
  } catch (e: any) {
    return back(`error=${encodeURIComponent(e.message)}`);
  }
  const res = back('connected=instagram');
  res.cookies.delete('ig_state');
  return res;
}

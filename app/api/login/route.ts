import { NextResponse } from 'next/server';
import { AUTH_COOKIE, sessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'No APP_PASSWORD is set yet. Add it in Vercel → Settings → Environment Variables, then redeploy.' }, { status: 500 });
  }
  if (password !== expected) return NextResponse.json({ error: 'That password is not right.' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await sessionToken(expected), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

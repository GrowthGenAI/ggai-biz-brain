import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, sessionToken } from './lib/auth';

const OPEN_PATHS = ['/login', '/api/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (OPEN_PATHS.some((p) => pathname === p)) return NextResponse.next();

  const password = process.env.APP_PASSWORD;
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  const ok = !!password && cookie === (await sessionToken(password));
  if (ok) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|ggai-mark.svg).*)'],
};

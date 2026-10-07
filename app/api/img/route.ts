// Same-origin copy of a stored image, so PNG export can draw it without browser security blocks.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get('u') || '';
  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return new Response('Bad url', { status: 400 });
  }
  if (target.protocol !== 'https:' || !target.hostname.endsWith('.blob.vercel-storage.com')) {
    return new Response('Not allowed', { status: 400 });
  }
  const res = await fetch(target.toString());
  if (!res.ok) return new Response('Not found', { status: 404 });
  return new Response(res.body, {
    headers: { 'content-type': res.headers.get('content-type') || 'image/png', 'cache-control': 'private, max-age=3600' },
  });
}

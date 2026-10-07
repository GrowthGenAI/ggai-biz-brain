import { readLocalMedia } from '@/lib/store';

// Only used when running locally without a Blob store.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const buf = await readLocalMedia(name);
  if (!buf) return new Response('Not found', { status: 404 });
  const ext = name.split('.').pop();
  const type = ext === 'jpg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : ext === 'webp' ? 'image/webp' : 'image/png';
  return new Response(new Uint8Array(buf), { headers: { 'content-type': type, 'cache-control': 'public, max-age=31536000' } });
}

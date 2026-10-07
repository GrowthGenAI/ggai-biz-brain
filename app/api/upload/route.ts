import { NextResponse } from 'next/server';
import { saveMedia } from '@/lib/store';

export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' };

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Please upload a PNG, JPG, WebP or SVG image.' }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Image is over 4 MB. Please use a smaller one.' }, { status: 400 });
  const url = await saveMedia(Buffer.from(await file.arrayBuffer()), ext, file.type);
  return NextResponse.json({ url });
}

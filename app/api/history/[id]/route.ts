import { NextResponse } from 'next/server';
import { getOutput, saveOutput } from '@/lib/history';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const out = await getOutput(id);
  if (!out) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json(out);
}

/** Save edits made in the browser (e.g. fixing a slide's words). */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const out = await getOutput(id);
  if (!out) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const { data, title } = await req.json();
  if (data) out.data = data;
  if (title) out.title = String(title).slice(0, 120);
  await saveOutput(out);
  return NextResponse.json(out);
}

import { NextResponse } from 'next/server';
import { generate } from '@/lib/engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { input } = await req.json();
    if (!input || !String(input).trim()) return NextResponse.json({ error: 'Type a command or a question first.' }, { status: 400 });
    return NextResponse.json(await generate(String(input)));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Something went wrong.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { generate } from '@/lib/engine';
import { routeInstruction } from '@/lib/router';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** One instruction in: the chief routes it, the right team member does the work. */
export async function POST(req: Request) {
  try {
    const { input, step, route: given } = await req.json();
    const text = String(input || '').trim();
    if (!text) return NextResponse.json({ error: 'Tell the team what you need first.' }, { status: 400 });
    const route = given?.lane ? given : await routeInstruction(text);
    if (step === 'route') return NextResponse.json({ route });
    const brief = text.startsWith('/') ? text : route.command ? `${route.command} ${text}` : text;
    const playbook = route.lane === 'strategist' ? 'strategist' : route.lane === 'research' ? 'research' : undefined;
    const output = await generate(brief, playbook);
    return NextResponse.json({ route, output });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Something went wrong.' }, { status: 500 });
  }
}

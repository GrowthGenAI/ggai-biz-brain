import { NextResponse } from 'next/server';
import { generate } from '@/lib/engine';
import { routeInstruction, type Route } from '@/lib/router';
import { briefText, researchBrief } from '@/lib/research';
import { COMMANDS } from '@/lib/commands';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * The Command Centre runs in steps so the screen can show each team member at work:
 *   step "route"    → the chief picks who handles it
 *   step "research" → Research finds the angle in the notes (content jobs)
 *   step "make"     → Strategist / Research / Content produce the result
 */
export async function POST(req: Request) {
  try {
    const { input, step, route: given, brief } = await req.json();
    const text = String(input || '').trim();
    if (!text) return NextResponse.json({ error: 'Tell the team what you need first.' }, { status: 400 });

    if (step === 'route') return NextResponse.json({ route: await routeInstruction(text) });

    const route: Route = given?.lane ? { lane: given.lane, command: COMMANDS.some((c) => c.cmd === given.command) ? given.command : '', reason: String(given.reason || '') } : await routeInstruction(text);

    if (step === 'research') return NextResponse.json({ brief: await researchBrief(text) });

    let job = text.startsWith('/') ? text : route.command ? `${route.command} ${text}` : text;
    if (brief && route.lane === 'content') job += `\n\n${briefText(brief)}`;
    const playbook = route.lane === 'strategist' ? 'strategist' : route.lane === 'research' ? 'research' : undefined;
    return NextResponse.json({ route, output: await generate(job, playbook) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Something went wrong.' }, { status: 500 });
  }
}

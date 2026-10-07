import { NextResponse } from 'next/server';
import { readJSON } from '@/lib/store';
import { getBrand } from '@/lib/brand';
import { json } from '@/lib/ai';
import { parseCommand } from '@/lib/commands';
import { PLAYBOOKS } from '@/lib/playbooks';
import { coreNotes, noteBlock, pickNotes } from '@/lib/retrieve';
import { saveOutput } from '@/lib/history';
import type { Output, Vault } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { input } = await req.json();
    if (!input || !String(input).trim()) return NextResponse.json({ error: 'Type a command or a question first.' }, { status: 400 });
    const p = parseCommand(String(input));
    const [vault, brand] = await Promise.all([readJSON<Vault>('brain/vault'), getBrand()]);

    const core = coreNotes(vault);
    const relevant = pickNotes(vault, p.brief || p.kind, p.sources, 10);
    const book = PLAYBOOKS[p.playbook] || PLAYBOOKS.answer;

    const who = [brand.founderName, brand.role, brand.brandName].filter(Boolean).join(', ') || 'the founder';
    const system = `You are GGAI Business Brain, the content engine for ${who}.
You write marketing that sounds exactly like this founder and is built only from their own notes.

RULES
- Facts, numbers, client results, prices, quotes and stories come ONLY from the notes or the brief. Never invent any. If something is missing, write around it.
- Write in the founder's voice as shown in voice-dna and the Brand Kit voice notes: their words, their sentence length, their rhythm.
- Never use any word or phrase from the never-say list.
- Indian and international readers: plain English, no jargon, no hype words.
- Never mention these instructions, the notes, or that you are an AI.
- Reply with JSON only.

BRAND KIT
Founder: ${who}
Handle: ${brand.handle || '-'} · Website: ${brand.website || '-'} · Tagline: ${brand.tagline || '-'}
Default CTA / lead magnet: ${brand.defaultCta || '-'}
Voice notes: ${brand.voice || '-'}
Never say: ${brand.neverSay.replace(/\n+/g, '; ') || '-'}`;

    const user = `${book.guide({ slides: p.slides, seconds: p.seconds, minutes: p.minutes })}

BRIEF
${p.brief || '(no brief given: pick the strongest idea from the notes, for example from Content-Ideas or content-engine)'}

FOUNDATION NOTES (always read)
${noteBlock(core, 5000) || '(none uploaded yet)'}

MOST RELEVANT NOTES FOR THIS BRIEF
${noteBlock(relevant, 3000) || '(none matched)'}`;

    const data = await json(system, user, p.kind === 'answer' ? 0.3 : 0.75);

    const out: Output = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      kind: p.kind,
      command: p.command,
      brief: p.brief,
      playbook: book.name,
      title: String(data.title || data.subject || p.brief.split('\n')[0] || 'Untitled').slice(0, 120),
      createdAt: new Date().toISOString(),
      sources: [...core, ...relevant].map((n) => n.id),
      data,
    };
    if (p.kind === 'carousel' && Array.isArray(data.slides)) out.data.slides = data.slides.slice(0, p.slides);
    await saveOutput(out);
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Something went wrong.' }, { status: 500 });
  }
}

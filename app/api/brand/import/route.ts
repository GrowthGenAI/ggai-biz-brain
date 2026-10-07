import { NextResponse } from 'next/server';
import { readJSON } from '@/lib/store';
import { getBrand } from '@/lib/brand';
import { json } from '@/lib/ai';
import type { Vault } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Read brand-identity, voice-dna and messaging notes from the vault and suggest Brand Kit values. */
export async function POST() {
  const vault = await readJSON<Vault>('brain/vault');
  if (!vault?.notes?.length) return NextResponse.json({ error: 'Upload your vault first (Brain page).' }, { status: 400 });
  const want = ['brand-identity', 'visual-identity', 'voice-dna', 'brand-messaging', 'brand-positioning', 'business-in-a-box', 'claude'];
  const picked = vault.notes.filter((n) => want.includes(n.id));
  if (!picked.length) return NextResponse.json({ error: 'No brand-identity or voice-dna note found in your vault.' }, { status: 400 });
  const notes = picked.map((n) => `### ${n.path}\n${n.content.slice(0, 9000)}`).join('\n\n');
  const current = await getBrand();

  const out = await json(
    `You extract a brand kit from a founder's own documents. Copy values exactly; never invent. Leave a field "" when the documents do not state it. Hex codes must be #RRGGBB taken from the documents.`,
    `Documents:\n${notes}\n\nReturn JSON:
{"founderName":"","brandName":"","role":"","handle":"","tagline":"","website":"",
 "colors":{"primary":"","secondary":"","accent":"","background":"","text":""},
 "fonts":{"heading":"","body":""},
 "voice": "5-8 lines describing how they write, using their own signature phrases",
 "neverSay": "their never-say words and phrases, one per line",
 "defaultCta": "their lead-magnet or main call to action if stated"}`,
    0.1
  );

  const pick = (v: any, fallback: string) => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
  const hex = (v: any, fallback: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v.trim()) ? v.trim().toUpperCase() : fallback);
  const suggestion = {
    founderName: pick(out.founderName, current.founderName),
    brandName: pick(out.brandName, current.brandName),
    role: pick(out.role, current.role),
    handle: pick(out.handle, current.handle),
    tagline: pick(out.tagline, current.tagline),
    website: pick(out.website, current.website),
    colors: {
      primary: hex(out.colors?.primary, current.colors.primary),
      secondary: hex(out.colors?.secondary, current.colors.secondary),
      accent: hex(out.colors?.accent, current.colors.accent),
      background: hex(out.colors?.background, current.colors.background),
      text: hex(out.colors?.text, current.colors.text),
    },
    fonts: { heading: pick(out.fonts?.heading, current.fonts.heading), body: pick(out.fonts?.body, current.fonts.body) },
    voice: pick(out.voice, current.voice),
    neverSay: pick(out.neverSay, current.neverSay),
    defaultCta: pick(out.defaultCta, current.defaultCta),
  };
  return NextResponse.json(suggestion);
}

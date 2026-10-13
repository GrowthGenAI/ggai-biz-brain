import { readJSON } from './store';
import { json } from './ai';
import { coreNotes, noteBlock, pickNotes } from './retrieve';
import type { Vault } from './types';

export type ResearchBrief = { angle: string; hook: string; proof: string; points: string[]; notes: string[] };

/** Research step before Content writes: find the sharpest angle for this request in the founder's notes. */
export async function researchBrief(request: string): Promise<ResearchBrief> {
  const vault = await readJSON<Vault>('brain/vault');
  const core = coreNotes(vault);
  const relevant = pickNotes(vault, request, [], 8);
  const r = await json<any>(
    `You are a content researcher for one founder. Using ONLY their notes, find the sharpest angle for the request.
Never invent facts, numbers or client results. Reply with JSON only:
{"angle": one sentence, "hook": one opening line in the founder's voice, "proof": the strongest real proof point from the notes or "", "points": 3-5 short points the piece should make, "notes": [ids of the notes you used]}`,
    `REQUEST\n${request}\n\nNOTES\n${noteBlock([...core, ...relevant], 2500)}`,
    0.4,
  );
  return {
    angle: String(r.angle || ''),
    hook: String(r.hook || ''),
    proof: String(r.proof || ''),
    points: Array.isArray(r.points) ? r.points.map(String).slice(0, 5) : [],
    notes: Array.isArray(r.notes) ? r.notes.map(String).slice(0, 12) : [],
  };
}

export function briefText(b: ResearchBrief) {
  return [
    'RESEARCH BRIEF (from my notes, use this angle):',
    b.angle && `Angle: ${b.angle}`,
    b.hook && `Hook idea: ${b.hook}`,
    b.proof && `Proof: ${b.proof}`,
    b.points.length ? `Points: ${b.points.join(' | ')}` : '',
  ].filter(Boolean).join('\n');
}

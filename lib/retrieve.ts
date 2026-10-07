import type { Note, Vault } from './types';

const STOP = new Set(
  'the and for with that this from your you are was were have has had not but all any can our out who what when where how why which will would about into over than then them they their there these those its it’s just also very more most some such only own same too use using make made like get got one two per via each other been being both does did doing let lets my me i we us is be to of in on at by or as an a'.split(' ')
);

export const CORE_NOTES = ['voice-dna', 'brand-messaging', 'rule-of-one', 'icp', 'business-in-a-box'];

function terms(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9'’-]{2,}/g) || []).filter((t) => !STOP.has(t));
}

function count(hay: string, needle: string): number {
  let n = 0;
  let i = hay.indexOf(needle);
  while (i !== -1 && n < 8) {
    n++;
    i = hay.indexOf(needle, i + needle.length);
  }
  return n;
}

/**
 * Pick the notes that matter for this brief:
 * - files named in a "Source:" line always come first,
 * - then the 10 best matches, where a word in a note's TITLE counts six times more than in its body.
 */
export function pickNotes(vault: Vault | null, brief: string, sources: string[] = [], limit = 10): Note[] {
  if (!vault?.notes?.length) return [];
  const qs = Array.from(new Set(terms(brief)));
  const scored = vault.notes
    .filter((n) => !CORE_NOTES.includes(n.id))
    .map((n) => {
      const title = n.title.toLowerCase();
      const body = n.content.toLowerCase();
      let score = 0;
      for (const q of qs) score += count(title, q) * 6 + count(body, q);
      if (sources.includes(n.id)) score += 1000;
      if (n.folder === 'Wiki') score += 0.5;
      return { n, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.n);
  return scored;
}

export function coreNotes(vault: Vault | null): Note[] {
  if (!vault?.notes) return [];
  return CORE_NOTES.map((id) => vault.notes.find((n) => n.id === id)).filter(Boolean) as Note[];
}

export function noteBlock(notes: Note[], perNote: number): string {
  return notes
    .map((n) => `### ${n.path}\n${n.content.length > perNote ? n.content.slice(0, perNote) + '\n…(trimmed)' : n.content}`)
    .join('\n\n');
}

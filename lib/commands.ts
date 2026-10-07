import type { Kind } from './types';

export const COMMANDS: { cmd: string; kind: Exclude<Kind, 'answer'>; label: string; hint: string; aliases: string[] }[] = [
  { cmd: '/carousel', kind: 'carousel', label: 'Carousel', hint: 'Swipe deck for LinkedIn, exports to PDF', aliases: ['/deck', '/slides'] },
  { cmd: '/newsletter', kind: 'newsletter', label: 'Newsletter', hint: 'Email issue with a hero illustration', aliases: ['/email'] },
  { cmd: '/image', kind: 'image', label: 'Image post', hint: 'One on-brand image with words and caption', aliases: ['/picture', '/img'] },
  { cmd: '/text', kind: 'text', label: 'Text post', hint: 'LinkedIn or X post in your voice', aliases: ['/post'] },
  { cmd: '/reel', kind: 'reel', label: 'Reel script', hint: 'Short video script, 15 to 90 seconds', aliases: ['/reels', '/short'] },
  { cmd: '/video', kind: 'video', label: 'Long video', hint: 'Long video script with chapters', aliases: ['/script', '/longform', '/youtube'] },
  { cmd: '/leadmagnet', kind: 'carousel', label: 'Lead magnet', hint: 'Free guide or checklist: LinkedIn PDF + Instagram slides', aliases: ['/magnet', '/freebie', '/guide'] },
];

export type Parsed = {
  kind: Kind;
  command: string;
  brief: string;
  slides: number;
  seconds: number;
  minutes: number;
  sources: string[];
  playbook: string;
};

export function detectKind(input: string): { kind: Kind; command: string } {
  const first = input.trim().split(/\s+/)[0]?.toLowerCase() || '';
  for (const c of COMMANDS) {
    if (first === c.cmd || c.aliases.includes(first)) return { kind: c.kind, command: c.cmd };
  }
  return { kind: 'answer', command: '' };
}

export function parseCommand(input: string): Parsed {
  const text = input.trim();
  const { kind, command } = detectKind(text);
  const brief = command ? text.replace(/^\S+\s*/, '') : text;
  const lower = brief.toLowerCase();

  const slideMatch = lower.match(/(\d{1,2})\s*slides?\b/);
  const isMagnet = command === '/leadmagnet';
  const pageMatch = lower.match(/(\d{1,2})\s*pages?\b/);
  let slides = slideMatch ? parseInt(slideMatch[1], 10) : pageMatch && isMagnet ? parseInt(pageMatch[1], 10) : isMagnet ? 8 : 7;
  slides = Math.min(15, Math.max(3, slides));

  const secMatch = lower.match(/\b(15|30|45|60|90)\s*(seconds?|secs?|s)\b/);
  const seconds = secMatch ? parseInt(secMatch[1], 10) : 60;

  const minMatch = lower.match(/(\d{1,2})\s*(minutes?|mins?)\b/);
  let minutes = minMatch ? parseInt(minMatch[1], 10) : 10;
  minutes = Math.min(30, Math.max(3, minutes));

  const srcMatch = brief.match(/^\s*sources?\s*:\s*(.+)$/im);
  const sources = srcMatch
    ? srcMatch[1].split(/[,;]/).map((s) => slug(s.replace(/\.md$/i, ''))).filter(Boolean)
    : [];

  return { kind, command, brief, slides, seconds, minutes, sources, playbook: isMagnet ? 'lead-magnet' : pickPlaybook(kind, lower) };
}

export function pickPlaybook(kind: Kind, lower: string): string {
  if (kind === 'image') return 'image-post';
  if (kind === 'carousel') {
    if (/do'?s and don'?ts|dos and donts/.test(lower)) return 'dos-donts';
    if (/\b(vs\.?|versus|compare|comparison)\b/.test(lower)) return 'comparison';
    if (/listicle|top \d+|\b\d+\s+(ways|tips|reasons|lessons|mistakes|steps|tools)\b/.test(lower)) return 'listicle';
    if (/\bintent\b/.test(lower)) return 'intent-carousel';
    return 'carousel';
  }
  if (kind === 'text') {
    if (/\b(story|personal|journey|turning point|lesson i learned)\b/.test(lower)) return 'story-post';
    if (/\b(framework|playbook|steps|how to|tactical|checklist|list)\b/.test(lower)) return 'framework-post';
    return 'intent-post';
  }
  if (kind === 'newsletter') return 'newsletter';
  if (kind === 'reel') return 'reel';
  if (kind === 'video') return 'video';
  return 'answer';
}

export function slug(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\.md$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

import type { Note } from './types';
import { slug } from './commands';

// Pure helpers: safe to use in the browser and on the server.

const SKIP = /(^|\/)(\.obsidian|\.trash|\.git|node_modules|__MACOSX)(\/|$)|(^|\/)\./;

export function buildNote(rawPath: string, content: string, rootToStrip = ''): Note | null {
  let p = rawPath.replace(/\\/g, '/');
  if (rootToStrip && p.startsWith(rootToStrip)) p = p.slice(rootToStrip.length);
  p = p.replace(/^\/+/, '');
  if (SKIP.test(p)) return null;
  if (!/\.(md|markdown|txt|csv)$/i.test(p)) return null;
  const file = p.split('/').pop() || p;
  const base = file.replace(/\.(md|markdown|txt|csv)$/i, '');
  const parts = p.split('/');
  const folder = parts.length > 1 ? parts[0] : 'Root';
  const body = content.replace(/\r\n/g, '\n');
  const links = Array.from(body.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)).map((m) => slug(m[1].split('/').pop() || m[1]));
  return {
    id: slug(base),
    path: p,
    title: base.replace(/[-_]+/g, ' ').trim(),
    folder,
    content: body,
    links: Array.from(new Set(links)),
  };
}

/** If every path in a zip starts with the same top folder (e.g. "Sujata Second Brain/"), strip it. */
export function commonRoot(paths: string[]): string {
  const firsts = new Set(paths.map((p) => p.replace(/\\/g, '/').split('/')[0]));
  if (firsts.size === 1 && paths.every((p) => p.includes('/'))) return [...firsts][0] + '/';
  return '';
}

export function dedupeNotes(notes: Note[]): Note[] {
  const seen = new Map<string, Note>();
  for (const n of notes) {
    // Prefer Foundation versions over copies elsewhere.
    const prev = seen.get(n.id);
    if (!prev || (n.folder === 'Foundation' && prev.folder !== 'Foundation')) seen.set(n.id, n);
  }
  return [...seen.values()];
}

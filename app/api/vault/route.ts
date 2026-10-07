import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/store';
import { buildNote, dedupeNotes } from '@/lib/vault';
import type { Note, Vault } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const vault = await readJSON<Vault>('brain/vault');
  return NextResponse.json(vault || { notes: [], uploadedAt: '' });
}

/**
 * POST { mode: 'replace', notes: Note[] }  → replace the whole vault (from the zip upload)
 * POST { mode: 'add', title, content }     → add or update one document
 * POST { mode: 'remove', id }              → remove one note
 */
export async function POST(req: Request) {
  const body = await req.json();
  const current = (await readJSON<Vault>('brain/vault')) || { notes: [], uploadedAt: '' };

  if (body.mode === 'replace') {
    const notes: Note[] = Array.isArray(body.notes) ? body.notes : [];
    const clean = dedupeNotes(
      notes
        .map((n) => buildNote(String(n.path || ''), String(n.content || '')))
        .filter(Boolean) as Note[]
    );
    // Keep documents added by hand.
    const docs = current.notes.filter((n) => n.folder === 'Documents' && !clean.find((c) => c.id === n.id));
    const vault: Vault = { notes: [...clean, ...docs], uploadedAt: new Date().toISOString(), source: String(body.source || 'zip') };
    await writeJSON('brain/vault', vault);
    return NextResponse.json({ ok: true, count: vault.notes.length });
  }

  if (body.mode === 'add') {
    const title = String(body.title || '').trim() || 'Untitled';
    const ext = /\.(md|markdown|txt|csv)$/i.test(title) ? '' : '.md';
    const note = buildNote(`Documents/${title}${ext}`, String(body.content || ''));
    if (!note || !note.content.trim()) return NextResponse.json({ error: 'The document is empty.' }, { status: 400 });
    const notes = current.notes.filter((n) => n.id !== note.id);
    notes.push(note);
    await writeJSON('brain/vault', { ...current, notes, uploadedAt: current.uploadedAt || new Date().toISOString() });
    return NextResponse.json({ ok: true, count: notes.length });
  }

  if (body.mode === 'remove') {
    const notes = current.notes.filter((n) => n.id !== body.id);
    await writeJSON('brain/vault', { ...current, notes });
    return NextResponse.json({ ok: true, count: notes.length });
  }

  return NextResponse.json({ error: 'Unknown request.' }, { status: 400 });
}

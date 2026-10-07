'use client';
import { useEffect, useState } from 'react';
import JSZip from 'jszip';
import Constellation from '@/components/Constellation';
import { buildNote, commonRoot, dedupeNotes } from '@/lib/vault';
import type { Note, Vault } from '@/lib/types';

export default function Brain() {
  const [vault, setVault] = useState<Vault>({ notes: [], uploadedAt: '' });
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [hot, setHot] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docText, setDocText] = useState('');
  const [filter, setFilter] = useState('');

  async function load() {
    const v = await fetch('/api/vault').then((r) => r.json());
    setVault(v);
  }
  useEffect(() => { load(); }, []);

  async function uploadZip(file: File) {
    setErr(''); setMsg('');
    if (!/\.zip$/i.test(file.name)) return setErr('Please choose the .zip of your whole Second Brain folder.');
    setBusy('Reading your vault…');
    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((f) => !f.dir);
      const root = commonRoot(entries.map((e) => e.name));
      const notes: Note[] = [];
      for (const e of entries) {
        if (!/\.(md|markdown|txt|csv)$/i.test(e.name)) continue;
        const content = await e.async('string');
        const n = buildNote(e.name, content, root);
        if (n) notes.push(n);
      }
      const clean = dedupeNotes(notes);
      if (!clean.length) throw new Error('No notes (.md files) were found in that zip.');
      setBusy(`Saving ${clean.length} notes…`);
      const res = await fetch('/api/vault', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'replace', source: file.name, notes: clean.map((n) => ({ path: n.path, content: n.content })) }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setMsg(`${j.count} notes imported.`);
      await load();
    } catch (e: any) {
      setErr(e.message || 'Upload failed.');
    } finally {
      setBusy('');
    }
  }

  async function addDoc(title: string, content: string) {
    setErr(''); setMsg('');
    const res = await fetch('/api/vault', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'add', title, content }) });
    const j = await res.json();
    if (!res.ok) return setErr(j.error);
    setMsg(`Saved "${title}".`);
    setDocTitle(''); setDocText('');
    load();
  }

  async function addFile(file: File) {
    if (!/\.(md|markdown|txt|csv)$/i.test(file.name)) return setErr('Documents can be .md, .markdown, .txt or .csv.');
    addDoc(file.name, await file.text());
  }

  async function remove(id: string) {
    if (!confirm('Remove this note from your brain?')) return;
    await fetch('/api/vault', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'remove', id }) });
    load();
  }

  const folders = vault.notes.reduce<Record<string, number>>((acc, n) => ((acc[n.folder] = (acc[n.folder] || 0) + 1), acc), {});
  const links = vault.notes.reduce((s, n) => s + n.links.length, 0);
  const shown = vault.notes.filter((n) => !filter || (n.title + n.path).toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div>
        <h1>Your brain</h1>
        <p className="sub">Upload your zipped Second Brain folder. Re-upload once a week so the dashboard knows what is new.</p>
      </div>

      <div className="grid3">
        <div className="card"><div className="muted">Notes</div><h1 style={{ margin: 0 }}>{vault.notes.length}</h1></div>
        <div className="card"><div className="muted">Links between notes</div><h1 style={{ margin: 0 }}>{links}</h1></div>
        <div className="card"><div className="muted">Last upload</div><h3 style={{ margin: '6px 0 0' }}>{vault.uploadedAt ? new Date(vault.uploadedAt).toLocaleString() : 'Not yet'}</h3></div>
      </div>

      <label
        className={`drop ${hot ? 'hot' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setHot(true); }}
        onDragLeave={() => setHot(false)}
        onDrop={(e) => { e.preventDefault(); setHot(false); const f = e.dataTransfer.files[0]; if (f) uploadZip(f); }}
      >
        <input type="file" accept=".zip" hidden onChange={(e) => e.target.files?.[0] && uploadZip(e.target.files[0])} />
        <h2>Upload vault</h2>
        <p className="muted">Drop your <b>Second Brain .zip</b> here, or click to choose it. Only your notes are read; photos stay on your computer.</p>
        {busy && <p className="row" style={{ justifyContent: 'center' }}><span className="spinner" /> {busy}</p>}
      </label>
      {msg && <div className="note">✓ {msg}</div>}
      {err && <div className="err">{err}</div>}

      <div>
        <h2>Knowledge constellation</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          {Object.entries(folders).map(([f, c]) => `${f}: ${c}`).join(' · ') || 'Empty'} · hover a dot to light its links
        </p>
        <Constellation notes={vault.notes} />
      </div>

      <div className="grid2">
        <div className="card stack">
          <h2>Add one document</h2>
          <p className="muted" style={{ margin: 0 }}>A call transcript, a proposal, a post that did well. Saved under Documents.</p>
          <label className="f">Title<input className="in" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. Client call with R, Oct 2026" /></label>
          <label className="f">Text<textarea className="in" rows={6} value={docText} onChange={(e) => setDocText(e.target.value)} /></label>
          <div className="row">
            <button className="btn" disabled={!docTitle || !docText} onClick={() => addDoc(docTitle, docText)}>Save document</button>
            <label className="btn ghost">Or upload a file<input type="file" hidden accept=".md,.markdown,.txt,.csv" onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0])} /></label>
          </div>
        </div>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Notes</h2>
            <input className="in" style={{ width: 180 }} placeholder="Search" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div style={{ maxHeight: 330, overflow: 'auto', marginTop: 10 }}>
            {shown.map((n) => (
              <div key={n.id} className="row" style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: 14 }}><span className="pill">{n.folder}</span> {n.title}</span>
                <button className="btn small ghost" onClick={() => remove(n.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

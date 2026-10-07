import { readJSON, writeJSON } from './store';
import type { HistoryItem, Output } from './types';

export async function saveOutput(out: Output) {
  await writeJSON(`brain/history/${out.id}`, out);
  const index = (await readJSON<HistoryItem[]>('brain/history-index')) || [];
  const item: HistoryItem = { id: out.id, kind: out.kind, title: out.title, createdAt: out.createdAt, command: out.command };
  const next = [item, ...index.filter((i) => i.id !== out.id)].slice(0, 300);
  await writeJSON('brain/history-index', next);
}

export async function getOutput(id: string) {
  if (!/^[\w-]+$/.test(id)) return null;
  return readJSON<Output>(`brain/history/${id}`);
}

export async function listOutputs() {
  return (await readJSON<HistoryItem[]>('brain/history-index')) || [];
}

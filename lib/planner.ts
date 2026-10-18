import { readJSON, writeJSON, loadMedia } from './store';
import { createPost, getAccount, uploadMedia } from './linkedin';
import { getIgAccount, publishInstagram, refreshIfOld } from './instagram';
import { nowIndia, writeSheet } from './sheet';

/*
 * The Content Planner: one row per approved post, with a date and the
 * platforms it goes to. The daily job posts every row that is due.
 */

export type Status = 'scheduled' | 'posting' | 'posted' | 'failed';
export type PlanRow = {
  id: string;
  outputId: string;
  title: string;
  kind: string;
  date: string; // YYYY-MM-DD, India time
  createdAt: string;
  sheetRow?: number; // row in the content sheet this post came from
  linkedin?: { text: string; docTitle?: string; fileUrl?: string; fileType?: 'pdf' | 'image'; status: Status; url?: string; error?: string; postedAt?: string };
  instagram?: { caption: string; imageUrls: string[]; status: Status; url?: string; error?: string; postedAt?: string };
};

const KEY = 'brain/planner';

export async function getPlan() {
  return (await readJSON<PlanRow[]>(KEY)) || [];
}

export async function savePlan(rows: PlanRow[]) {
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  await writeJSON(KEY, rows);
}

export async function updateRow(id: string, fn: (r: PlanRow) => PlanRow | null) {
  const rows = await getPlan();
  const next: PlanRow[] = [];
  for (const r of rows) {
    if (r.id !== id) next.push(r);
    else {
      const u = fn(r);
      if (u) next.push(u);
    }
  }
  await savePlan(next);
  return next.find((r) => r.id === id) || null;
}

export function todayIndia() {
  return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
}

async function postLinkedIn(r: PlanRow) {
  const li = r.linkedin!;
  const a = await getAccount();
  if (!a || new Date(a.expiresAt) < new Date()) throw new Error('LinkedIn is not connected (or the 60-day connection ran out). Open Planner → Connect LinkedIn.');
  let media: { id: string; title?: string } | undefined;
  if (li.fileUrl) {
    const bytes = await loadMedia(li.fileUrl);
    if (!bytes) throw new Error('The file for this post could not be found. Remove the row and schedule it again.');
    media = li.fileType === 'pdf'
      ? { id: await uploadMedia(a, 'documents', bytes, 'application/pdf'), title: li.docTitle || r.title }
      : { id: await uploadMedia(a, 'images', bytes, /\.png(\?|$)/i.test(li.fileUrl) ? 'image/png' : 'image/jpeg') };
  }
  return createPost(a, li.text, media);
}

async function postInstagram(r: PlanRow) {
  let a = await getIgAccount();
  if (!a || new Date(a.expiresAt) < new Date()) throw new Error('Instagram is not connected. Open Planner → Connect Instagram.');
  a = await refreshIfOld(a);
  return publishInstagram(a, r.instagram!.imageUrls, r.instagram!.caption);
}

/** Post every platform on this row that is still waiting. */
export async function runRow(id: string) {
  const row = (await getPlan()).find((r) => r.id === id);
  if (!row) throw new Error('That row was not found.');
  for (const p of ['linkedin', 'instagram'] as const) {
    const part = row[p];
    if (!part || part.status === 'posted') continue;
    try {
      const url = p === 'linkedin' ? await postLinkedIn(row) : await postInstagram(row);
      await updateRow(id, (r) => ({ ...r, [p]: { ...r[p]!, status: 'posted', url, error: undefined, postedAt: new Date().toISOString() } }));
    } catch (e: any) {
      await updateRow(id, (r) => ({ ...r, [p]: { ...r[p]!, status: 'failed', error: e.message || 'Posting failed.' } }));
    }
  }
  const after = (await getPlan()).find((r) => r.id === id);
  if (after?.sheetRow) await reportToSheet(after);
  return after;
}

/** Write the result back to the content sheet: Posted + link, or Failed + why. */
async function reportToSheet(r: PlanRow) {
  const parts = [r.linkedin, r.instagram].filter(Boolean) as { status: Status; url?: string; error?: string }[];
  if (!parts.length) return;
  const failed = parts.filter((p) => p.status === 'failed');
  const posted = parts.filter((p) => p.status === 'posted');
  if (posted.length === parts.length) {
    await writeSheet(r.sheetRow!, { Status: 'Posted', 'Post link': posted.map((p) => p.url).filter(Boolean).join(' '), 'Posted at': nowIndia(), Error: '' });
  } else if (failed.length) {
    await writeSheet(r.sheetRow!, { Status: 'Failed', Error: failed.map((p) => p.error).join(' | ').slice(0, 400) });
  }
}

/** Daily job: everything dated today or earlier that is still scheduled. */
export async function runDue(deadlineMs: number) {
  const today = todayIndia();
  const due = (await getPlan()).filter(
    (r) => r.date <= today && (r.linkedin?.status === 'scheduled' || r.instagram?.status === 'scheduled'),
  );
  const done: string[] = [];
  for (const r of due) {
    if (Date.now() > deadlineMs) break;
    await runRow(r.id);
    done.push(r.id);
  }
  return done;
}

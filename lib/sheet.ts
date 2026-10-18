/*
 * The content sheet: a Google Sheet the founder (or the agency) edits and approves.
 * The sheet is reached through a small Apps Script web app pasted into the sheet
 * (Extensions → Apps Script), so no Google keys are stored here: only its link
 * (SHEET_SCRIPT_URL) and a shared word (SHEET_TOKEN) that the script checks.
 */

export type SheetRow = {
  row: number; // the row number in the sheet (2 = first post)
  Date: string;
  Platform: string;
  Format: string;
  Topic: string;
  Hook: string;
  'Full text / caption': string;
  Slides: string;
  'Image idea': string;
  'Call to action': string;
  Status: string;
  'Post link'?: string;
  Notes?: string;
};

export function sheetConfigured() {
  return !!(process.env.SHEET_SCRIPT_URL && process.env.SHEET_TOKEN);
}

export async function readSheet(): Promise<SheetRow[]> {
  if (!sheetConfigured()) throw new Error('The content sheet is not connected yet. Add SHEET_SCRIPT_URL and SHEET_TOKEN in Vercel, then Redeploy.');
  const u = new URL(process.env.SHEET_SCRIPT_URL!);
  u.searchParams.set('token', process.env.SHEET_TOKEN!);
  const res = await fetch(u, { cache: 'no-store', redirect: 'follow' });
  const text = await res.text();
  let j: any;
  try { j = JSON.parse(text); } catch { throw new Error('The sheet link did not answer. Check the Apps Script is deployed as a Web app with access "Anyone".'); }
  if (j.error) throw new Error(`The sheet said: ${j.error}`);
  return (j.rows || []).map((r: any) => ({ ...r, Date: String(r.Date || '').slice(0, 10) }));
}

/** Write a few cells back on one row, e.g. Status, Post link, Posted at, Error. Never throws. */
export async function writeSheet(row: number, fields: Record<string, string>) {
  if (!sheetConfigured() || !row) return false;
  try {
    const res = await fetch(process.env.SHEET_SCRIPT_URL!, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ token: process.env.SHEET_TOKEN, row, fields }),
      redirect: 'follow',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function nowIndia() {
  return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
}

/** The Apps Script the founder pastes into the sheet once (shown in the Planner). */
export const APPS_SCRIPT = `const TOKEN = 'PASTE-THE-SAME-WORD-AS-SHEET_TOKEN';

function sheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet(e) {
  if (e.parameter.token !== TOKEN) return out_({ error: 'Not allowed' });
  const v = sheet_().getDataRange().getValues();
  const head = v[0];
  const rows = v.slice(1).map(function (r, i) {
    const o = { row: i + 2 };
    head.forEach(function (k, j) {
      o[k] = r[j] instanceof Date ? Utilities.formatDate(r[j], 'Asia/Kolkata', 'yyyy-MM-dd') : String(r[j]);
    });
    return o;
  });
  return out_({ rows: rows });
}

function doPost(e) {
  const b = JSON.parse(e.postData.contents);
  if (b.token !== TOKEN) return out_({ error: 'Not allowed' });
  const s = sheet_();
  const head = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
  Object.keys(b.fields || {}).forEach(function (k) {
    const c = head.indexOf(k);
    if (c >= 0) s.getRange(b.row, c + 1).setValue(b.fields[k]);
  });
  return out_({ ok: true });
}`;

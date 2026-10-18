import { NextResponse } from 'next/server';
import { APPS_SCRIPT, readSheet, sheetConfigured, writeSheet } from '@/lib/sheet';
import { saveOutput } from '@/lib/history';
import { getPlan } from '@/lib/planner';
import type { Kind, Output } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Approved rows in the content sheet that are not in the Planner yet. */
export async function GET() {
  if (!sheetConfigured()) return NextResponse.json({ configured: false, script: APPS_SCRIPT, rows: [] });
  try {
    const [rows, plan] = await Promise.all([readSheet(), getPlan()]);
    const inPlanner = new Set(plan.map((r) => r.sheetRow).filter(Boolean));
    const approved = rows.filter((r) => /^approved$/i.test(String(r.Status || '').trim()) && !inPlanner.has(r.row));
    const counts = rows.reduce((m: Record<string, number>, r) => ((m[r.Status || 'Blank'] = (m[r.Status || 'Blank'] || 0) + 1), m), {});
    return NextResponse.json({ configured: true, script: APPS_SCRIPT, rows: approved, counts });
  } catch (e: any) {
    return NextResponse.json({ configured: true, script: APPS_SCRIPT, rows: [], error: e.message }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));

  // Save a sheet row as a dashboard post, so it can be viewed and scheduled like any other.
  if (b.action === 'output') {
    const kind = (['text', 'carousel', 'image'].includes(b.kind) ? b.kind : 'text') as Kind;
    const out: Output = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      command: 'sheet',
      brief: `From the content sheet, row ${b.row}`,
      playbook: 'content-sheet',
      title: String(b.title || 'Sheet post').slice(0, 120),
      createdAt: new Date().toISOString(),
      sources: ['content sheet'],
      data: b.data || {},
    };
    await saveOutput(out);
    return NextResponse.json({ ok: true, id: out.id });
  }

  // Write a few cells back, e.g. mark a reel script as not auto-posted.
  if (b.action === 'mark') {
    const fields: Record<string, string> = {};
    for (const k of ['Status', 'Notes', 'Error']) if (typeof b.fields?.[k] === 'string') fields[k] = b.fields[k];
    const ok = await writeSheet(Number(b.row), fields);
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}

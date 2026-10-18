import { formatPost } from '@/lib/postformat';
import { NextResponse } from 'next/server';
import { getAccount, linkedinConfigured } from '@/lib/linkedin';
import { getIgAccount, instagramConfigured } from '@/lib/instagram';
import { getPlan, runRow, savePlan, todayIndia, updateRow, type PlanRow } from '@/lib/planner';
import { getOutput } from '@/lib/history';
import { writeSheet } from '@/lib/sheet';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const [rows, li, ig] = await Promise.all([getPlan(), getAccount(), getIgAccount()]);
  const live = (x: { expiresAt: string } | null) => !!x && new Date(x.expiresAt) > new Date();
  return NextResponse.json({
    today: todayIndia(),
    rows,
    linkedin: { configured: linkedinConfigured(), connected: live(li), name: li?.name || '', expiresAt: li?.expiresAt || '' },
    instagram: { configured: instagramConfigured(), connected: live(ig), name: ig?.username || '', expiresAt: ig?.expiresAt || '' },
  });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const ok = (extra: object = {}) => NextResponse.json({ ok: true, ...extra });

  if (b.action === 'add') {
    if (b.linkedin?.text) b.linkedin.text = formatPost(String(b.linkedin.text));
    if (b.instagram?.caption) b.instagram.caption = formatPost(String(b.instagram.caption));
    const out = await getOutput(String(b.outputId || ''));
    if (!out) return NextResponse.json({ error: 'That post was not found.' }, { status: 404 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) return NextResponse.json({ error: 'Pick a date.' }, { status: 400 });
    if (!b.linkedin && !b.instagram) return NextResponse.json({ error: 'Tick LinkedIn or Instagram.' }, { status: 400 });
    if (b.linkedin && !String(b.linkedin.text || '').trim()) return NextResponse.json({ error: 'The LinkedIn text is empty.' }, { status: 400 });
    if (b.linkedin && b.linkedin.text.length > 3000) return NextResponse.json({ error: `LinkedIn allows 3,000 characters. This post has ${b.linkedin.text.length}.` }, { status: 400 });
    if (b.instagram && !(b.instagram.imageUrls || []).length) return NextResponse.json({ error: 'Instagram needs at least one image.' }, { status: 400 });
    if (b.instagram && String(b.instagram.caption || '').length > 2200) return NextResponse.json({ error: 'Instagram captions can be 2,200 characters at most.' }, { status: 400 });
    const row: PlanRow = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      outputId: out.id,
      title: out.title,
      kind: out.kind,
      date: b.date,
      createdAt: new Date().toISOString(),
      ...(Number(b.sheetRow) > 1 ? { sheetRow: Number(b.sheetRow) } : {}),
      ...(b.linkedin ? { linkedin: { text: b.linkedin.text, docTitle: b.linkedin.docTitle, fileUrl: b.linkedin.fileUrl, fileType: b.linkedin.fileType, status: 'scheduled' as const } } : {}),
      ...(b.instagram ? { instagram: { caption: b.instagram.caption || '', imageUrls: b.instagram.imageUrls, status: 'scheduled' as const } } : {}),
    };
    await savePlan([...(await getPlan()), row]);
    if (row.sheetRow) await writeSheet(row.sheetRow, { Status: 'Scheduled', Error: '' });
    if (b.postNow) return ok({ row: await runRow(row.id) });
    return ok({ row });
  }

  if (b.action === 'remove') {
    await updateRow(String(b.id), () => null);
    return ok();
  }

  if (b.action === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) return NextResponse.json({ error: 'Pick a date.' }, { status: 400 });
    await updateRow(String(b.id), (r) => ({ ...r, date: b.date }));
    return ok();
  }

  if (b.action === 'run') {
    return ok({ row: await runRow(String(b.id)) });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}

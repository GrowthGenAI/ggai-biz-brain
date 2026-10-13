import { NextResponse } from 'next/server';
import { runDue } from '@/lib/planner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Called by Vercel Cron every morning (see vercel.json). Protected by CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  }
  const done = await runDue(Date.now() + 45_000);
  return NextResponse.json({ ok: true, posted: done.length });
}

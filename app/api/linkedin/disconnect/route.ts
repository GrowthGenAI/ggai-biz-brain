import { NextResponse } from 'next/server';
import { clearAccount } from '@/lib/linkedin';

export async function POST() {
  await clearAccount();
  return NextResponse.json({ ok: true });
}

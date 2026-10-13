import { NextResponse } from 'next/server';
import { clearIgAccount } from '@/lib/instagram';

export async function POST() {
  await clearIgAccount();
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { listOutputs } from '@/lib/history';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await listOutputs());
}

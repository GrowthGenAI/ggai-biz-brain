import { NextResponse } from 'next/server';
import { writeJSON } from '@/lib/store';
import { getBrand } from '@/lib/brand';
import type { BrandKit } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getBrand());
}

export async function POST(req: Request) {
  const incoming = (await req.json()) as Partial<BrandKit>;
  const current = await getBrand();
  const merged: BrandKit = {
    ...current,
    ...incoming,
    colors: { ...current.colors, ...(incoming.colors || {}) },
    fonts: { ...current.fonts, ...(incoming.fonts || {}) },
    updatedAt: new Date().toISOString(),
  };
  await writeJSON('brain/brand', merged);
  return NextResponse.json(merged);
}

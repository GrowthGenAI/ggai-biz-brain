import { NextResponse } from 'next/server';
import { readJSON, storageMode } from '@/lib/store';
import { getBrand, brandReadiness } from '@/lib/brand';
import type { Vault } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [vault, brand] = await Promise.all([readJSON<Vault>('brain/vault'), getBrand()]);
  return NextResponse.json({
    notes: vault?.notes?.length || 0,
    uploadedAt: vault?.uploadedAt || '',
    brandReadiness: brandReadiness(brand),
    brandName: brand.brandName || brand.founderName || '',
    openai: !!process.env.OPENAI_API_KEY,
    storage: storageMode(),
  });
}

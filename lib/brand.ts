import { readJSON } from './store';
import { EMPTY_BRAND, type BrandKit } from './types';

export async function getBrand(): Promise<BrandKit> {
  const saved = await readJSON<Partial<BrandKit>>('brain/brand');
  return {
    ...EMPTY_BRAND,
    ...(saved || {}),
    colors: { ...EMPTY_BRAND.colors, ...(saved?.colors || {}) },
    fonts: { ...EMPTY_BRAND.fonts, ...(saved?.fonts || {}) },
  };
}

export function brandReadiness(b: BrandKit): number {
  const checks = [b.founderName, b.brandName, b.role, b.handle, b.tagline, b.website, b.voice, b.neverSay, b.defaultCta, b.headshotUrl, b.logoUrl, b.updatedAt];
  return Math.round((checks.filter((x) => !!(x && String(x).trim())).length / checks.length) * 100);
}

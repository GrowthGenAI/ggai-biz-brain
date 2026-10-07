import { NextResponse } from 'next/server';
import { getBrand } from '@/lib/brand';
import { drawImage } from '@/lib/ai';
import { getOutput, saveOutput } from '@/lib/history';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Draws one image and stores its URL on a saved output.
 * body: { id, target: 'image' | 'hero' | 'slide', index?, prompt?, shape?, founder? }
 */
export async function POST(req: Request) {
  try {
    const { id, target, index, prompt, shape, founder } = await req.json();
    const out = await getOutput(String(id));
    if (!out) return NextResponse.json({ error: 'Output not found.' }, { status: 404 });
    const brand = await getBrand();

    let finalPrompt = String(prompt || '');
    let finalShape = (shape || 'square') as 'square' | 'portrait' | 'landscape';

    if (target === 'image') {
      const d = out.data;
      finalShape = d.shape || 'square';
      finalPrompt = `${d.imagePrompt}\nStyle: ${d.style || 'Brand graphic'}. On-image text, spelled exactly: "${d.onImageText}". Make the text large, crisp and readable.`;
    } else if (target === 'hero') {
      finalShape = 'landscape';
      finalPrompt = `${out.data.heroPrompt}\nWarm editorial illustration for an email header. No text, no letters.`;
    } else if (target === 'slide') {
      const s = out.data.slides?.[index];
      if (!s) return NextResponse.json({ error: 'Slide not found.' }, { status: 404 });
      finalShape = 'square';
      finalPrompt = `Simple flat illustration for a LinkedIn carousel slide about: ${s.heading}. ${s.visual || ''}. Minimal, plenty of empty space, no text, no letters, no logos.`;
    }

    const url = await drawImage(finalPrompt, finalShape, brand, !!founder || (target === 'image' && !!out.data.includeFounder));

    if (target === 'image') out.data.imageUrl = url;
    if (target === 'hero') out.data.heroUrl = url;
    if (target === 'slide') out.data.slides[index].imageUrl = url;
    await saveOutput(out);
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'The image could not be drawn.' }, { status: 500 });
  }
}

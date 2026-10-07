import OpenAI, { toFile } from 'openai';
import type { BrandKit } from './types';
import { loadMedia, saveMedia } from './store';

let client: OpenAI | null = null;
export function openai() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing. Add it in Vercel → Settings → Environment Variables, then redeploy.');
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export const TEXT_MODEL = () => process.env.OPENAI_MODEL || 'gpt-4.1';
export const IMAGE_MODEL = () => process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

export async function json<T = any>(system: string, user: string, temperature = 0.7): Promise<T> {
  const res = await openai().chat.completions.create({
    model: TEXT_MODEL(),
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  const text = res.choices[0]?.message?.content || '{}';
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('The writer returned something unreadable. Please try again.');
  }
}

const SIZES = { square: '1024x1024', portrait: '1024x1536', landscape: '1536x1024' } as const;

export function brandStyle(b: BrandKit) {
  const c = b.colors;
  return `Brand palette: primary ${c.primary}, secondary ${c.secondary}, accent ${c.accent}, background ${c.background}. Use these colours deliberately. Clean, premium, uncluttered.`;
}

/** Draw an image. If useHeadshot is true and a headshot exists, it is used as the reference photo. */
export async function drawImage(prompt: string, shape: keyof typeof SIZES, brand: BrandKit, useHeadshot = false): Promise<string> {
  const size = SIZES[shape] || SIZES.square;
  const full = `${prompt}\n\n${brandStyle(brand)}`;
  let b64: string | undefined;
  if (useHeadshot && brand.headshotUrl) {
    const buf = await loadMedia(brand.headshotUrl);
    if (buf) {
      const file = await toFile(buf, 'headshot.png', { type: 'image/png' });
      const res = await openai().images.edit({
        model: IMAGE_MODEL(),
        image: file,
        prompt: `${full}\nThe person in the reference photo is the founder. Keep their face and likeness exactly; place them naturally in the scene.`,
        size,
      } as any);
      b64 = res.data?.[0]?.b64_json;
    }
  }
  if (!b64) {
    const res = await openai().images.generate({ model: IMAGE_MODEL(), prompt: full, size } as any);
    b64 = res.data?.[0]?.b64_json;
    if (!b64 && res.data?.[0]?.url) {
      const r = await fetch(res.data[0].url);
      return saveMedia(Buffer.from(await r.arrayBuffer()), 'png', 'image/png');
    }
  }
  if (!b64) throw new Error('No image came back. Check your OpenAI credit and try again.');
  return saveMedia(Buffer.from(b64, 'base64'), 'png', 'image/png');
}

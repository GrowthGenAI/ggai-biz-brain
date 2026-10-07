// Shared by middleware (edge) and API routes (node). Uses Web Crypto only.
export const AUTH_COOKIE = 'ggai_auth';

export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}:ggai-business-brain:v1`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

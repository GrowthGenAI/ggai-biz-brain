import { NextResponse } from 'next/server';

// Short link for WhatsApp template buttons (WhatsApp does not allow direct chat.whatsapp.com links).
// Client copies: set COMMUNITY_URL in Vercel to their own community link.
export function GET() {
  const to = process.env.COMMUNITY_URL || 'https://chat.whatsapp.com/G85mIF93oXW04kbAicouzt';
  return NextResponse.redirect(to, 307);
}

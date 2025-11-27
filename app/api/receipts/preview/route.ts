import { NextRequest } from 'next/server';
import { generateServerPDFBuffer } from '@/lib/pdf-server';
import type { Donation } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const donation: Donation | undefined = body?.donation;
    const logoBase64: string | undefined = body?.logoBase64;

    if (!donation) {
      return new Response(JSON.stringify({ error: 'donation payload is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pdfBuffer = await generateServerPDFBuffer(donation);
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Failed to generate preview', details: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

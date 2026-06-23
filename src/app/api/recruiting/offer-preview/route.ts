import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** GET /api/recruiting/offer-preview?docId=xxx — export a Google Doc as PDF for preview */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as unknown as Record<string, unknown>)?.accessToken as string;
    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');
    if (!docId) {
      return NextResponse.json({ success: false, error: 'Missing docId' }, { status: 400 });
    }

    // Export Google Doc as PDF
    const pdfRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!pdfRes.ok) {
      const text = await pdfRes.text();
      throw new Error(`PDF export failed (${pdfRes.status}): ${text}`);
    }

    const pdfBytes = await pdfRes.arrayBuffer();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error: unknown) {
    console.error('Failed to preview offer letter:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

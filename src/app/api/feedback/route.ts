import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const VALID_TYPES = new Set(['BUG', 'FEATURE', 'GENERAL']);

/** POST /api/feedback — submit feedback, attribution pulled from session */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const type = String(body.type || '').toUpperCase();
    const message = String(body.message || '').trim();

    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        type,
        message,
        submittedBy: session?.user?.email?.toLowerCase() || null,
        submittedByName: session?.user?.name || null,
      },
    });

    return NextResponse.json({ success: true, data: { id: feedback.id } });
  } catch (err) {
    console.error('Failed to submit feedback:', err);
    return NextResponse.json({ success: false, error: 'Failed to submit feedback' }, { status: 500 });
  }
}

/** GET /api/feedback — list all feedback (admin only) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const adminEmails = (process.env.RECRUITING_EMAILS || '')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  const email = session.user.email.toLowerCase();
  if (adminEmails.length > 0 && !adminEmails.includes(email)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const items = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ success: true, data: items });
}

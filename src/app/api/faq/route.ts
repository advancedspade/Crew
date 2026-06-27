import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** GET /api/faq — list published FAQs (any authenticated user) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const items = await prisma.faq.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, question: true, answer: true, publishedAt: true },
  });
  return NextResponse.json({ success: true, data: items });
}

/** POST /api/faq — submit a new question (any authenticated user) */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const question = String(body.question || '').trim();

    if (!question) {
      return NextResponse.json({ success: false, error: 'Question required' }, { status: 400 });
    }
    if (question.length > 1000) {
      return NextResponse.json({ success: false, error: 'Question too long (max 1000 chars)' }, { status: 400 });
    }

    const faq = await prisma.faq.create({
      data: {
        question,
        submittedBy: session?.user?.email?.toLowerCase() || null,
        submittedByName: session?.user?.name || null,
      },
    });

    // Fire-and-forget Slack notification (silently skipped if no webhook configured)
    notifyFaqSubmitted(faq).catch((err) => console.error('Slack FAQ notify failed:', err));

    return NextResponse.json({ success: true, data: { id: faq.id } });
  } catch (err) {
    console.error('Failed to submit FAQ question:', err);
    return NextResponse.json({ success: false, error: 'Failed to submit question' }, { status: 500 });
  }
}

async function notifyFaqSubmitted(faq: {
  id: string;
  question: string;
  submittedByName: string | null;
  submittedBy: string | null;
}) {
  const webhookUrl = process.env.SLACK_FAQ_WEBHOOK_URL;
  if (!webhookUrl) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const link = appUrl ? `<${appUrl}/faq/admin|answer it>` : 'answer it in /faq/admin';
  const submitter = faq.submittedByName || faq.submittedBy || 'Someone';
  const text = `New FAQ question from *${submitter}* — ${link}\n> ${faq.question}`;
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mrkdwn: true }),
  });
}

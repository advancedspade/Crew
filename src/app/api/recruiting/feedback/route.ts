import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** GET /api/recruiting/feedback?candidateId=xxx — get the current user's feedback */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const candidateId = request.nextUrl.searchParams.get('candidateId');

    const where: Record<string, string> = { submittedBy: session.user.email };
    if (candidateId) where.candidateId = candidateId;

    const feedback = await prisma.interviewFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        candidate: { select: { id: true, name: true, role: true, status: true } },
      },
    });

    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/** POST /api/recruiting/feedback — submit feedback for a candidate */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { candidateId, technicalFeedback, behavioralFeedback, overallScore, additionalNotes, prefersVerbal } = body as {
      candidateId?: string;
      technicalFeedback?: string;
      behavioralFeedback?: string;
      overallScore?: number;
      additionalNotes?: string;
      prefersVerbal?: boolean;
    };

    if (!candidateId || !overallScore || overallScore < 1 || overallScore > 4) {
      return NextResponse.json(
        { success: false, error: 'candidateId and a valid overallScore (1-4) are required' },
        { status: 400 }
      );
    }

    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Build a combined legacy `feedback` string for backwards compatibility
    const parts: string[] = [];
    if (technicalFeedback?.trim()) parts.push(`Technical: ${technicalFeedback.trim()}`);
    if (behavioralFeedback?.trim()) parts.push(`Behavioral: ${behavioralFeedback.trim()}`);
    parts.push(`Overall: ${overallScore}/4`);
    if (additionalNotes?.trim()) parts.push(`Notes: ${additionalNotes.trim()}`);
    if (prefersVerbal) parts.push('Prefers to give verbal feedback.');

    const entry = await prisma.interviewFeedback.create({
      data: {
        candidateId,
        submittedBy: session.user.email,
        submittedByName: session.user.name || null,
        submittedByImage: session.user.image || null,
        feedback: parts.join('\n'),
        technicalFeedback: technicalFeedback?.trim() || null,
        behavioralFeedback: behavioralFeedback?.trim() || null,
        overallScore,
        additionalNotes: additionalNotes?.trim() || null,
        prefersVerbal: !!prefersVerbal,
      },
      include: {
        candidate: { select: { id: true, name: true, role: true, status: true } },
      },
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

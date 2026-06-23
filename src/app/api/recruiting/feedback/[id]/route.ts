import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** DELETE /api/recruiting/feedback/[id] — delete your own feedback */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const feedback = await prisma.interviewFeedback.findUnique({ where: { id } });
    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
    }
    if (feedback.submittedBy !== session.user.email) {
      return NextResponse.json({ success: false, error: 'You can only delete your own feedback' }, { status: 403 });
    }

    await prisma.interviewFeedback.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete feedback:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

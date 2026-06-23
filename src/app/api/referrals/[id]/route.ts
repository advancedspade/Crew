import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** DELETE /api/referrals/[id] — delete a referral (only the submitter can delete) */
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

    // Verify the referral exists and belongs to the current user
    const referral = await prisma.referral.findUnique({ where: { id } });
    if (!referral) {
      return NextResponse.json({ success: false, error: 'Referral not found' }, { status: 404 });
    }
    if (referral.submittedBy !== session.user.email) {
      return NextResponse.json({ success: false, error: 'You can only delete your own referrals' }, { status: 403 });
    }

    await prisma.referral.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete referral:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

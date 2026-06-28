import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/** DELETE /api/team/tracker/[id]/checkins/[checkinId] — remove a logged event (admin only) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; checkinId: string }> }
) {
  const session = await getServerSession(authOptions);
  const denial = requireAdmin(session?.user?.email);
  if (denial) return denial;

  try {
    const { id, checkinId } = await params;
    await prisma.checkin.delete({ where: { id: checkinId, userId: id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete checkin:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}

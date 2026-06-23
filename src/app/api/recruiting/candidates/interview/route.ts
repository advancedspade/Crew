import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** GET /api/recruiting/candidates/interview — minimal list of INTERVIEW-stage candidates for the feedback form */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const candidates = await prisma.candidate.findMany({
      where: { status: 'INTERVIEW' },
      select: { id: true, name: true, role: true, linkedin: true, resumeDriveFileId: true, resumeFileName: true, resumeWebViewLink: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: candidates });
  } catch (error) {
    console.error('Failed to fetch interview candidates:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

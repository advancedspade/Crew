import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** GET /api/team-directory — list all users who have logged in */
export async function GET() {
  try {
    const users = await prisma.appUser.findMany({
      orderBy: { name: 'asc' },
    });

    const team = users.map((u) => ({
      id: u.id,
      name: u.name || u.email.split('@')[0],
      email: u.email,
      image: u.image,
      defaultTicketTypes: (u.defaultTicketTypes as string[] | null) || [],
      slackUserId: u.slackUserId || null,
      lastLogin: u.lastLogin.toISOString(),
      joinedAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: team });
  } catch (error) {
    console.error('Failed to fetch team directory:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/** PATCH /api/team-directory — update a user's defaultTicketTypes */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const body = await request.json();
    const { userId, defaultTicketTypes, slackUserId } = body as { userId: string; defaultTicketTypes?: string[]; slackUserId?: string | null };
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }
    const updateData: Record<string, unknown> = {};
    if (defaultTicketTypes !== undefined) updateData.defaultTicketTypes = defaultTicketTypes;
    if (slackUserId !== undefined) updateData.slackUserId = slackUserId || null;
    const updated = await prisma.appUser.update({
      where: { id: userId },
      data: updateData,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update team member:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

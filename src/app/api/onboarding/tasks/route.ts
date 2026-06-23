import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/onboarding/tasks
 * Upsert an onboarding task. Body:
 *   { candidateId, taskKey, completed?: boolean, assigneeEmail?: string | null }
 * Only the provided fields are updated.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { candidateId, taskKey, completed, assigneeEmail } = body as {
      candidateId?: string;
      taskKey?: string;
      completed?: boolean;
      assigneeEmail?: string | null;
    };

    if (!candidateId || !taskKey) {
      return NextResponse.json(
        { success: false, error: 'candidateId and taskKey are required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const createData: Record<string, unknown> = { candidateId, taskKey };

    if (completed !== undefined) {
      updateData.completedAt = completed ? new Date() : null;
      updateData.completedBy = completed ? session.user.email : null;
      createData.completedAt = completed ? new Date() : null;
      createData.completedBy = completed ? session.user.email : null;
    }

    if (assigneeEmail !== undefined) {
      updateData.assigneeEmail = assigneeEmail || null;
      createData.assigneeEmail = assigneeEmail || null;
    }

    const task = await prisma.onboardingTask.upsert({
      where: { candidateId_taskKey: { candidateId, taskKey } },
      update: updateData,
      create: createData as { candidateId: string; taskKey: string },
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('Failed to upsert onboarding task:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

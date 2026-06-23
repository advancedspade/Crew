import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** GET /api/onboarding — list hired candidates with a start date, plus their onboarding tasks */
export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      where: { status: 'HIRED', startDate: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        startDate: true,
        officeLocation: true,
        manager: true,
        team: true,
        employmentType: true,
        onboardingStageOverride: true,
        workEmail: true,
        onboardingTasks: {
          select: {
            taskKey: true,
            assigneeEmail: true,
            completedAt: true,
            completedBy: true,
          },
        },
        onboardingTickets: {
          select: {
            id: true,
            type: true,
            status: true,
            assigneeEmail: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ success: true, data: candidates });
  } catch (error) {
    console.error('Failed to fetch onboarding data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

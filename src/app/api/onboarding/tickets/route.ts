import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { computeTicketDueDate, buildInitialTicketData, getDefaultAssignee } from '@/lib/onboarding-tickets';

/** GET /api/onboarding/tickets — list all tickets joined with candidate */
export async function GET() {
  try {
    const tickets = await prisma.onboardingTicket.findMany({
      include: {
        candidate: {
          select: {
            id: true, name: true, email: true, role: true, startDate: true, officeLocation: true,
            team: true, workEmail: true, status: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error('Failed to list onboarding tickets:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/** POST /api/onboarding/tickets — manually create a ticket (admin/dev path) */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const body = await request.json();
    const { candidateId, type, assigneeEmail, notes } = body as {
      candidateId?: string;
      type?: 'DEEL_EMAIL' | 'OFFICE' | 'SAFETY' | 'TRUCK' | 'IT' | 'ONE_WEEK';
      assigneeEmail?: string | null;
      notes?: string | null;
    };
    if (!candidateId || !type) {
      return NextResponse.json({ success: false, error: 'candidateId and type are required' }, { status: 400 });
    }
    // Look up candidate to compute dueDate and initialize checklist data
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { startDate: true, officeLocation: true, team: true },
    });
    const dueDate = candidate ? computeTicketDueDate(type, candidate.startDate) : null;
    const ticketData = candidate ? buildInitialTicketData(type, candidate) : {};
    // Use provided assignee, or fall back to directory default
    const resolvedAssignee = assigneeEmail || await getDefaultAssignee(type);
    const created = await prisma.onboardingTicket.create({
      data: {
        candidateId, type,
        assigneeEmail: resolvedAssignee || null,
        notes: notes || null,
        ...(dueDate ? { dueDate } : {}),
        ...(Object.keys(ticketData).length ? { data: ticketData as unknown as Record<string, never> } : {}),
      },
    });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Failed to create onboarding ticket:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

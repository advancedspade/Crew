import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createFollowOnTickets, notifyTicketSlack } from '@/lib/onboarding-tickets';
import type { Prisma } from '@prisma/client';

/**
 * PATCH /api/onboarding/tickets/[id]
 * Body: { assigneeEmail?, notes?, status?, workEmail?, checklistKey?, checklistCompleted?, checklistNA?, checklistMeta? }
 *
 * Completing a DEEL_EMAIL ticket requires a workEmail; on completion it stores the
 * email on the candidate and auto-creates the 4 follow-on tickets, firing Slack for
 * each in their respective channel.
 *
 * Checklist toggling: pass { checklistKey, checklistCompleted, checklistMeta? } to
 * toggle a single checklist item. checklistMeta is a Record<string,string> for items
 * with metadata fields (e.g. truck purchase details).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const { id } = await params;

    const existing = await prisma.onboardingTicket.findUnique({
      where: { id },
      include: { candidate: { select: { id: true, name: true, role: true, startDate: true, officeLocation: true, workEmail: true } } },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    const { assigneeEmail, notes, status, workEmail, checklistKey, checklistCompleted, checklistNA, checklistMeta } = body as {
      assigneeEmail?: string | null;
      notes?: string | null;
      status?: 'OPEN' | 'DONE';
      workEmail?: string | null;
      checklistKey?: string;
      checklistCompleted?: boolean;
      checklistNA?: boolean;
      checklistMeta?: Record<string, string>;
    };

    // ── Checklist item toggle ───────────────────────────────────────────
    if (checklistKey !== undefined) {
      const ticketData = (existing.data as Record<string, unknown>) || {};
      const checklist = (ticketData.checklist as Record<string, unknown>) || {};
      const item = (checklist[checklistKey] as Record<string, unknown>) || {};
      if (checklistNA) {
        // Mark as N/A
        item.completedAt = null;
        item.completedBy = null;
        item.naAt = new Date().toISOString();
        item.naBy = session.user.email;
      } else if (checklistCompleted) {
        item.completedAt = new Date().toISOString();
        item.completedBy = session.user.email;
        item.naAt = null;
        item.naBy = null;
        if (checklistMeta) item.meta = checklistMeta;
      } else {
        // Reset — unchecking
        item.completedAt = null;
        item.completedBy = null;
        item.naAt = null;
        item.naBy = null;
      }
      checklist[checklistKey] = item;
      ticketData.checklist = checklist;
      const updated = await prisma.onboardingTicket.update({
        where: { id },
        data: { data: ticketData as Prisma.InputJsonValue },
        include: { candidate: { select: { id: true, name: true, role: true, startDate: true, officeLocation: true, team: true, workEmail: true, status: true } } },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // ── Normal ticket update ────────────────────────────────────────────
    const completing = status === 'DONE' && existing.status !== 'DONE';
    const reopening  = status === 'OPEN' && existing.status === 'DONE';

    if (completing && existing.type === 'DEEL_EMAIL') {
      const email = (workEmail || existing.candidate.workEmail || '').trim();
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'A work email is required to complete the Deel/Email ticket' },
          { status: 400 }
        );
      }
      await prisma.candidate.update({ where: { id: existing.candidateId }, data: { workEmail: email } });
    } else if (typeof workEmail === 'string' && workEmail.trim()) {
      await prisma.candidate.update({ where: { id: existing.candidateId }, data: { workEmail: workEmail.trim() } });
    }

    const updated = await prisma.onboardingTicket.update({
      where: { id },
      data: {
        ...(assigneeEmail !== undefined ? { assigneeEmail: assigneeEmail || null } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        ...(status ? { status } : {}),
        ...(completing ? { completedAt: new Date(), completedBy: session.user.email } : {}),
        ...(reopening ? { completedAt: null, completedBy: null } : {}),
      },
      include: {
        candidate: { select: { id: true, name: true, role: true, startDate: true, officeLocation: true, team: true, workEmail: true, status: true } },
      },
    });

    if (completing && existing.type === 'DEEL_EMAIL') {
      const createdIds = await createFollowOnTickets(existing.candidateId);
      const newTickets = await prisma.onboardingTicket.findMany({
        where: { id: { in: createdIds } },
        include: { candidate: { select: { name: true, role: true, startDate: true, officeLocation: true, workEmail: true } } },
      });
      for (const t of newTickets) {
        await notifyTicketSlack(
          { type: t.type, assigneeEmail: t.assigneeEmail },
          t.candidate,
        );
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update onboarding ticket:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/** DELETE /api/onboarding/tickets/[id] — remove a ticket (admin cleanup) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const { id } = await params;
    await prisma.onboardingTicket.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete onboarding ticket:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

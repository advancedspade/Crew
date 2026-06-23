import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OnboardingStage } from '@prisma/client';
import { ensureDeelEmailTicket, ensureOneWeekTicket, notifyTicketSlack } from '@/lib/onboarding-tickets';

const STAGE_ORDER: OnboardingStage[] = ['QUEUE', 'THREE_WEEKS', 'ONE_WEEK', 'STARTED'];

function dateDerivedStage(startDate: Date | null): OnboardingStage {
  if (!startDate) return 'QUEUE';
  const ms = startDate.getTime() - Date.now();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'STARTED';
  if (days <= 7) return 'ONE_WEEK';
  if (days <= 21) return 'THREE_WEEKS';
  return 'QUEUE';
}

/**
 * POST /api/onboarding/override
 * Move a candidate forward or backward one onboarding stage.
 * Body: { candidateId, direction?: 'forward' | 'backward' } (default 'forward')
 * Forward sets onboardingStageOverride to the stage after the current effective stage.
 * Backward drops one stage; if the new override equals the date-derived stage, the
 * override is cleared (set to null) since overrides are forward-only.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { candidateId, direction = 'forward' } = body as {
      candidateId?: string;
      direction?: 'forward' | 'backward';
    };

    if (!candidateId) {
      return NextResponse.json({ success: false, error: 'candidateId is required' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { startDate: true, onboardingStageOverride: true },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    const derived = dateDerivedStage(candidate.startDate);
    const current = candidate.onboardingStageOverride ?? derived;
    const currentIndex = STAGE_ORDER.indexOf(current);

    let newOverride: OnboardingStage | null;
    if (direction === 'backward') {
      if (!candidate.onboardingStageOverride) {
        return NextResponse.json(
          { success: false, error: 'No override to undo' },
          { status: 400 }
        );
      }
      const prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        return NextResponse.json(
          { success: false, error: 'Candidate is already at the first stage' },
          { status: 400 }
        );
      }
      const prevStage = STAGE_ORDER[prevIndex];
      newOverride = STAGE_ORDER.indexOf(prevStage) <= STAGE_ORDER.indexOf(derived) ? null : prevStage;
    } else {
      if (currentIndex >= STAGE_ORDER.length - 1) {
        return NextResponse.json(
          { success: false, error: 'Candidate is already at the final stage' },
          { status: 400 }
        );
      }
      newOverride = STAGE_ORDER[currentIndex + 1];
    }

    const updated = await prisma.candidate.update({
      where: { id: candidateId },
      data: { onboardingStageOverride: newOverride },
      select: { id: true, onboardingStageOverride: true },
    });

    // If the effective stage is now THREE_WEEKS or beyond, ensure the DEEL_EMAIL ticket exists.
    const effectiveStage = newOverride ?? derived;
    if (effectiveStage !== 'QUEUE') {
      try {
        const { created, ticketId } = await ensureDeelEmailTicket(candidateId);
        if (created && ticketId) {
          const t = await prisma.onboardingTicket.findUnique({
            where: { id: ticketId },
            include: { candidate: { select: { name: true, role: true, startDate: true, officeLocation: true, workEmail: true } } },
          });
          if (t) await notifyTicketSlack({ type: t.type, assigneeEmail: t.assigneeEmail }, t.candidate);
        }
      } catch (err) { console.error('Failed to ensure DEEL_EMAIL ticket:', err); }
    }

    // If the effective stage is ONE_WEEK or STARTED, ensure the ONE_WEEK ticket exists.
    if (effectiveStage === 'ONE_WEEK' || effectiveStage === 'STARTED') {
      try {
        const { created, ticketId } = await ensureOneWeekTicket(candidateId);
        if (created && ticketId) {
          const t = await prisma.onboardingTicket.findUnique({
            where: { id: ticketId },
            include: { candidate: { select: { name: true, role: true, startDate: true, officeLocation: true, workEmail: true } } },
          });
          if (t) await notifyTicketSlack({ type: t.type, assigneeEmail: t.assigneeEmail }, t.candidate);
        }
      } catch (err) { console.error('Failed to ensure ONE_WEEK ticket:', err); }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to override onboarding stage:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureDeelEmailTicket, ensureOneWeekTicket, notifyTicketSlack } from '@/lib/onboarding-tickets';

/**
 * GET /api/cron/onboarding-tickets
 * Daily Vercel cron. Finds HIRED candidates within 21 days of start date and
 * creates a DEEL_EMAIL ticket + Slack notification if one doesn't already exist.
 * Also creates ONE_WEEK tickets for hires within 7 days of start date.
 *
 * Auth: Vercel cron requests carry an Authorization: Bearer <CRON_SECRET> header.
 * If CRON_SECRET is unset we allow the request (dev convenience).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000);
    const hires = await prisma.candidate.findMany({
      where: {
        status: 'HIRED',
        startDate: { not: null, lte: cutoff, gte: now },
        OR: [{ conversion: false }, { conversion: null }], // Skip conversions
      },
      select: { id: true, startDate: true },
    });

    let createdCount = 0;
    const errors: { candidateId: string; error: string }[] = [];

    for (const h of hires) {
      try {
        // DEEL_EMAIL ticket at 21 days out
        const { created, ticketId } = await ensureDeelEmailTicket(h.id);
        if (created && ticketId) {
          createdCount += 1;
          const t = await prisma.onboardingTicket.findUnique({
            where: { id: ticketId },
            include: { candidate: { select: { name: true, role: true, startDate: true, officeLocation: true, workEmail: true } } },
          });
          if (t) {
            await notifyTicketSlack(
              { type: t.type, assigneeEmail: t.assigneeEmail },
              t.candidate,
            );
          }
        }

        // ONE_WEEK ticket at 7 days out
        const oneWeek = await ensureOneWeekTicket(h.id);
        if (oneWeek.created && oneWeek.ticketId) {
          createdCount += 1;
          const t = await prisma.onboardingTicket.findUnique({
            where: { id: oneWeek.ticketId },
            include: { candidate: { select: { name: true, role: true, startDate: true, officeLocation: true, workEmail: true } } },
          });
          if (t) {
            await notifyTicketSlack(
              { type: t.type, assigneeEmail: t.assigneeEmail },
              t.candidate,
            );
          }
        }
      } catch (err) {
        errors.push({ candidateId: h.id, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      checked: hires.length,
      created: createdCount,
      errors,
    });
  } catch (error) {
    console.error('Onboarding tickets cron failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

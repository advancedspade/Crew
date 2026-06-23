import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** POST /api/recruiting/candidates/[id]/approve-offer — approve offer, notify Slack */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { recruiter: { select: { id: true, name: true } } },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    if (candidate.status !== 'OFFER' || candidate.offerStatus !== 'COMPLETE') {
      return NextResponse.json({ success: false, error: 'Candidate must have a completed offer' }, { status: 400 });
    }

    // Mark offer as APPROVED
    await prisma.candidate.update({
      where: { id },
      data: { offerStatus: 'APPROVED' },
    });

    // Send Slack webhook notification
    const webhookUrl = process.env.SLACK_OFFER_WEBHOOK_URL;
    if (webhookUrl) {
      // Prefer the directory-driven recruiter name; fall back to the legacy Recruiter relation.
      let recruiterName: string | null = candidate.recruiter?.name || null;
      if (candidate.recruiterEmail) {
        const u = await prisma.appUser.findUnique({
          where: { email: candidate.recruiterEmail.toLowerCase() },
          select: { name: true, email: true },
        });
        if (u) recruiterName = u.name || u.email.split('@')[0];
      }
      const assignee = recruiterName || 'Team';

      const text = `Offer letter approved for ${candidate.name}. ${assignee}, Send offer letter from Koda to ${candidate.email || 'N/A'}. Move to hired when signed offer letter is received.`;

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    }

    return NextResponse.json({ success: true, message: 'Offer approved and Slack notified' });
  } catch (error) {
    console.error('Failed to approve offer:', error);
    return NextResponse.json({ success: false, error: 'Failed to approve offer' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** GET /api/referrals — list the current user's referrals */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const referrals = await prisma.referral.findMany({
      where: { submittedBy: session.user.email },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: referrals });
  } catch (error) {
    console.error('Failed to fetch referrals:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/** POST /api/referrals — submit a referral */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, linkedin, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const referral = await prisma.referral.create({
      data: {
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        linkedin: linkedin || null,
        notes: notes || null,
        submittedBy: session.user.email,
        submittedByName: session.user.name || null,
      },
    });

    return NextResponse.json({ success: true, data: referral });
  } catch (error) {
    console.error('Failed to submit referral:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

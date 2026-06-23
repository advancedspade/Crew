import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** GET /api/recruiting/approvers — list AppUsers whose email is in RECRUITING_EMAILS */
export async function GET() {
  try {
    const recruitingEmails = (process.env.RECRUITING_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (recruitingEmails.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const users = await prisma.appUser.findMany({
      where: { email: { in: recruitingEmails } },
      orderBy: { name: 'asc' },
    });

    const approvers = users.map((u) => ({
      email: u.email,
      name: u.name || u.email.split('@')[0],
    }));

    // Include emails from env that have never logged in (so they're still pickable)
    const known = new Set(approvers.map((a) => a.email));
    for (const email of recruitingEmails) {
      if (!known.has(email)) approvers.push({ email, name: email });
    }

    approvers.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ success: true, data: approvers });
  } catch (error) {
    console.error('Failed to fetch approvers:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

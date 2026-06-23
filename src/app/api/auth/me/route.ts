import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const RECRUITING_EMAILS = (process.env.RECRUITING_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** GET /api/auth/me — returns current user info + isAdmin flag */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const email = session.user.email.toLowerCase();
  const isAdmin = RECRUITING_EMAILS.length > 0 && RECRUITING_EMAILS.includes(email);

  return NextResponse.json({
    success: true,
    data: {
      email,
      name: session.user.name || null,
      image: session.user.image || null,
      isAdmin,
    },
  });
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { requireFaqAdmin } from '@/lib/faq-auth';

/** GET /api/faq/admin — list all FAQs (admin only) */
export async function GET() {
  const session = await getServerSession(authOptions);
  const denial = requireFaqAdmin(session?.user?.email);
  if (denial) return denial;

  const items = await prisma.faq.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 500,
  });
  return NextResponse.json({ success: true, data: items });
}

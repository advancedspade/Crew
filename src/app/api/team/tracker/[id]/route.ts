import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/** PATCH /api/team/tracker/[id] — update tracker fields on AppUser (admin only) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const denial = requireAdmin(session?.user?.email);
  if (denial) return denial;

  try {
    const { id } = await params;
    const body = await request.json();
    const { startDate, role, team, officeLocation, manager, salary, salaryType, equityShares } = body as {
      startDate?: string | null;
      role?: string | null;
      team?: string | null;
      officeLocation?: string | null;
      manager?: string | null;
      salary?: number | string | null;
      salaryType?: string | null;
      equityShares?: number | string | null;
    };

    const data: Record<string, unknown> = {};
    if (startDate !== undefined)      data.startDate      = startDate ? new Date(startDate) : null;
    if (role !== undefined)           data.role           = role || null;
    if (team !== undefined)           data.team           = team || null;
    if (officeLocation !== undefined) data.officeLocation = officeLocation || null;
    if (manager !== undefined)        data.manager        = manager || null;
    if (salary !== undefined)         data.salary         = salary === null || salary === '' ? null : Number(salary);
    if (salaryType !== undefined)     data.salaryType     = salaryType || null;
    if (equityShares !== undefined)   data.equityShares   = equityShares === null || equityShares === '' ? null : Number(equityShares);

    const updated = await prisma.appUser.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Failed to update tracker user:', err);
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
  }
}

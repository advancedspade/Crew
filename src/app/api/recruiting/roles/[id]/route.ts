import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** PATCH /api/recruiting/roles/[id] — update a role */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, team, officeLocation, employmentType, relevantPeople } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) {
      if (!title?.trim()) {
        return NextResponse.json({ success: false, error: 'Title cannot be empty' }, { status: 400 });
      }
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      if (!description?.trim()) {
        return NextResponse.json({ success: false, error: 'Description cannot be empty' }, { status: 400 });
      }
      updateData.description = description.trim();
    }
    if (team !== undefined) {
      if (!team?.trim()) {
        return NextResponse.json({ success: false, error: 'Team cannot be empty' }, { status: 400 });
      }
      updateData.team = team.trim();
    }
    if (officeLocation !== undefined) updateData.officeLocation = officeLocation || null;
    if (employmentType !== undefined) updateData.employmentType = employmentType || null;
    if (relevantPeople !== undefined) {
      updateData.relevantPeople = Array.isArray(relevantPeople)
        ? relevantPeople.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
        : [];
    }

    const role = await prisma.role.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('Failed to update role:', error);
    return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
  }
}

/** DELETE /api/recruiting/roles/[id] — delete (close) a role */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete role:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete role' }, { status: 500 });
  }
}

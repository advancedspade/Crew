import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** GET /api/recruiting/roles — list all open roles */
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: [{ team: 'asc' }, { title: 'asc' }],
    });
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch roles' }, { status: 500 });
  }
}

/** POST /api/recruiting/roles — create a new role */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, team, officeLocation, employmentType, relevantPeople } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }
    if (!team?.trim()) {
      return NextResponse.json({ success: false, error: 'Team is required' }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        team: team.trim(),
        officeLocation: officeLocation || null,
        employmentType: employmentType || null,
        relevantPeople: Array.isArray(relevantPeople)
          ? relevantPeople.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
          : [],
      },
    });

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error) {
    console.error('Failed to create role:', error);
    return NextResponse.json({ success: false, error: 'Failed to create role' }, { status: 500 });
  }
}

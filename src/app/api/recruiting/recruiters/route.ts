import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** GET /api/recruiting/recruiters — list all recruiters */
export async function GET() {
  try {
    const recruiters = await prisma.recruiter.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { candidates: true } } },
    });
    return NextResponse.json({ success: true, data: recruiters });
  } catch (error) {
    console.error('Failed to fetch recruiters:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch recruiters' }, { status: 500 });
  }
}

/** POST /api/recruiting/recruiters — create a new recruiter */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const recruiter = await prisma.recruiter.create({
      data: { name },
    });

    return NextResponse.json({ success: true, data: recruiter }, { status: 201 });
  } catch (error) {
    console.error('Failed to create recruiter:', error);
    return NextResponse.json({ success: false, error: 'Failed to create recruiter' }, { status: 500 });
  }
}


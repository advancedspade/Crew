import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** GET /api/recruiting/candidates — list all candidates */
export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      include: { recruiter: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // Resolve recruiterEmail → name from AppUser so the UI doesn't have to.
    const emails = Array.from(new Set(candidates.map((c) => c.recruiterEmail).filter((e): e is string => !!e)));
    const users = emails.length
      ? await prisma.appUser.findMany({ where: { email: { in: emails } }, select: { email: true, name: true } })
      : [];
    const nameByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.name || u.email.split('@')[0]]));
    const data = candidates.map((c) => ({
      ...c,
      recruiterName: c.recruiterEmail ? (nameByEmail.get(c.recruiterEmail.toLowerCase()) || null) : null,
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch candidates:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

/** POST /api/recruiting/candidates — create a new candidate */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, roleId, email, phone, linkedin, notes, status, recruiterId, recruiterEmail, startDate, officeLocation, salary, salaryType, manager, equityShares, team, employmentType, conversion, convertedFromCandidateId, personalAddress, offerStatus, offerApproverEmail } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    // If a roleId is provided, snapshot the role title into the legacy role string for display continuity.
    let snapshotRole: string | null = role || null;
    if (roleId) {
      const r = await prisma.role.findUnique({ where: { id: roleId }, select: { title: true } });
      if (r) snapshotRole = r.title;
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        role: snapshotRole,
        roleId: roleId || null,
        email: email || null,
        phone: phone || null,
        linkedin: linkedin || null,
        notes: notes || null,
        status: status || 'REACHED_OUT',
        recruiterId: recruiterId || null,
        recruiterEmail: recruiterEmail ? recruiterEmail.toLowerCase() : null,
        startDate: startDate ? new Date(startDate) : null,
        officeLocation: officeLocation || null,
        salary: salary !== undefined && salary !== null ? Number(salary) : null,
        salaryType: salaryType || null,
        manager: manager || null,
        equityShares: equityShares !== undefined && equityShares !== null ? Number(equityShares) : null,
        team: team || null,
        employmentType: employmentType || null,
        conversion: conversion ?? null,
        convertedFromCandidateId: convertedFromCandidateId || null,
        personalAddress: personalAddress || null,
        offerStatus: offerStatus || null,
        offerApproverEmail: offerApproverEmail ? offerApproverEmail.toLowerCase() : null,
      },
      include: { recruiter: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: candidate }, { status: 201 });
  } catch (error) {
    console.error('Failed to create candidate:', error);
    return NextResponse.json({ success: false, error: 'Failed to create candidate' }, { status: 500 });
  }
}


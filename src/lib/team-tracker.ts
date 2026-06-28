import { prisma } from '@/lib/db';

/**
 * Map legacy recruiting team codes onto the tracker's canonical labels.
 * Recruiting still uses short codes (HW/SW/Ops); the tracker uses full names.
 * Unknown values pass through unchanged.
 */
const TEAM_NORMALIZE: Record<string, string> = {
  HW: 'Hardware',
  SW: 'Software',
  Ops: 'BizOps',
};
function normalizeTeam(value: string | null | undefined): string | null {
  if (!value) return null;
  return TEAM_NORMALIZE[value] ?? value;
}

/**
 * Try to link an AppUser to a Candidate via matching work email and copy
 * the snapshot fields used by the team tracker. Safe to call repeatedly.
 *
 * Called from:
 *  - The NextAuth sign-in callback (when AppUser is upserted by their work email)
 *  - The onboarding ticket route (when Candidate.workEmail is filled in)
 */
export async function linkAppUserToCandidate(appUserEmail: string): Promise<void> {
  if (!appUserEmail) return;
  const email = appUserEmail.toLowerCase();

  const [user, candidate] = await Promise.all([
    prisma.appUser.findUnique({ where: { email } }),
    prisma.candidate.findFirst({
      where: { workEmail: email },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!user || !candidate) return;
  if (user.candidateId === candidate.id) return; // already linked

  await prisma.appUser.update({
    where: { id: user.id },
    data: {
      candidateId: candidate.id,
      // Snapshot tracker fields — only copy when AppUser side is empty so we
      // don't overwrite admin edits made after link.
      startDate:      user.startDate      ?? candidate.startDate      ?? null,
      role:           user.role           ?? candidate.role           ?? null,
      team:           user.team           ?? normalizeTeam(candidate.team),
      officeLocation: user.officeLocation ?? candidate.officeLocation ?? null,
      manager:        user.manager        ?? candidate.manager        ?? null,
      salary:         user.salary         ?? candidate.salary         ?? null,
      salaryType:     user.salaryType     ?? candidate.salaryType     ?? null,
      equityShares:   user.equityShares   ?? candidate.equityShares   ?? null,
    },
  });
}

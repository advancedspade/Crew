export type CheckinType = 'CHECK_IN' | 'SALARY_CHANGE' | 'PROMOTION' | 'NOTE';

export interface TrackerCheckin {
  id: string;
  type: CheckinType;
  loggedBy: string;
  loggedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface TrackerUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  candidateId: string | null;
  startDate: string | null;
  role: string | null;
  team: string | null;
  officeLocation: string | null;
  manager: string | null;
  salary: number | null;
  salaryType: string | null;
  equityShares: number | null;
  lastCheckin: { id: string; type: CheckinType; loggedAt: string } | null;
  checkinCount: number;
  createdAt: string;
  lastLogin: string;
}

export const CHECKIN_TYPE_LABEL: Record<CheckinType, string> = {
  CHECK_IN: 'Check-in',
  SALARY_CHANGE: 'Salary change',
  PROMOTION: 'Promotion',
  NOTE: 'Note',
};

/** Office locations — same set used in Recruiting (RoleModal). */
export const OFFICE_OPTIONS: { value: string; label: string }[] = [
  { value: 'LB', label: 'Long Beach' },
  { value: 'Vegas', label: 'Las Vegas' },
  { value: 'Norcal', label: 'NorCal' },
];

export const SALARY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'annual', label: 'Annual' },
  { value: 'hourly', label: 'Hourly' },
];

/** Returns "1 yr 3 mo" / "4 mo" / "—" — short, readable tenure. */
export function formatTenure(startIso: string | null): string {
  if (!startIso) return '—';
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return '—';
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem} mo`;
  if (rem === 0) return `${years} yr`;
  return `${years} yr ${rem} mo`;
}

/** Returns whole days between iso date and today. Returns null if input falsy. */
export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const ms = Date.now() - then;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

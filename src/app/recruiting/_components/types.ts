export interface Recruiter {
  id: string;
  name: string;
  _count?: { candidates: number };
}

export interface Candidate {
  id: string;
  name: string;
  role: string | null;
  roleId: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  notes: string | null;
  status: string;
  recruiterId: string | null;
  recruiterEmail: string | null;
  recruiterName: string | null;
  recruiter: { id: string; name: string } | null;
  createdAt: string;
  startDate: string | null;
  officeLocation: string | null;
  salary: number | null;
  salaryType: string | null;
  manager: string | null;
  equityShares: number | null;
  team: string | null;
  employmentType: string | null;
  conversion: boolean | null;
  convertedFromCandidateId: string | null;
  personalAddress: string | null;
  offerStatus: string | null;
  offerDocId: string | null;
  offerDriveLink: string | null;
  offerApproverEmail: string | null;
  resumeDriveFileId: string | null;
  resumeFileName: string | null;
  resumeWebViewLink: string | null;
}

export const PIPELINE_STATUSES = [
  { key: 'REACHED_OUT', label: 'Reached Out' },
  { key: 'IN_DIALOGUE', label: 'In Dialogue' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'OFFER', label: 'Offer' },
] as const;

export const ALL_STATUSES = [
  ...PIPELINE_STATUSES,
  { key: 'HIRED', label: 'Hired' },
  { key: 'ON_ICE', label: 'On Ice' },
  { key: 'ARCHIVED', label: 'Archived' },
] as const;

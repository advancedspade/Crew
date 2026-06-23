'use client';

import { useState } from 'react';
import type { Candidate } from '../types';
import OfferFormFields from './OfferFormFields';

export default function OfferModal({ candidate, onClose, onConfirm }: {
  candidate: Candidate;
  onClose: () => void;
  onConfirm: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [startDate, setStartDate] = useState(candidate.startDate ? candidate.startDate.split('T')[0] : '');
  const [salary, setSalary] = useState(candidate.salary ? String(candidate.salary) : '');
  const [salaryType, setSalaryType] = useState(candidate.salaryType || '');
  const [manager, setManager] = useState(candidate.manager || '');
  const [officeLocation, setOfficeLocation] = useState(candidate.officeLocation || '');
  const [equityShares, setEquityShares] = useState(candidate.equityShares ? String(candidate.equityShares) : '');
  const [team, setTeam] = useState(candidate.team || '');
  const [employmentType, setEmploymentType] = useState(candidate.employmentType || '');
  const [conversion, setConversion] = useState(candidate.conversion ?? false);
  const [offerApproverEmail, setOfferApproverEmail] = useState(candidate.offerApproverEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const buildPayload = (status: 'PENDING' | 'COMPLETE') => ({
    startDate: startDate || undefined, officeLocation: officeLocation || undefined,
    salary: salary ? Number(salary) : undefined, salaryType: salaryType || undefined,
    manager: manager || undefined, team: team || undefined, employmentType: employmentType || undefined,
    conversion, offerStatus: status, offerApproverEmail: offerApproverEmail || null,
    ...(equityShares ? { equityShares: Number(equityShares) } : {}),
  });

  const isComplete = !!(startDate && salary && salaryType && manager && officeLocation && team && employmentType);

  const handleSave = async (status: 'PENDING' | 'COMPLETE') => {
    if (status === 'COMPLETE' && !isComplete) { setError('All required fields must be filled to create the offer'); return; }
    setIsSubmitting(true); setError('');
    try {
      await onConfirm(buildPayload(status));
    } catch {
      setError('Failed to save offer');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded bg-[var(--card-background)] p-6 shadow-md" onClick={e => e.stopPropagation()}>
        <h3 className="mb-1 text-xs font-black uppercase tracking-wide text-[var(--foreground)]">
          {candidate.offerStatus === 'PENDING' ? 'Complete Offer for' : 'Create Offer for'} {candidate.name}
        </h3>
        <p className="mb-5 text-sm text-[var(--text-secondary)]">{candidate.role || 'No position set'}</p>
        <div className="space-y-4">
          <OfferFormFields startDate={startDate} setStartDate={setStartDate} salary={salary} setSalary={setSalary}
            salaryType={salaryType} setSalaryType={setSalaryType} manager={manager} setManager={setManager}
            officeLocation={officeLocation} setOfficeLocation={setOfficeLocation} equityShares={equityShares} setEquityShares={setEquityShares}
            team={team} setTeam={setTeam} employmentType={employmentType} setEmploymentType={setEmploymentType}
            conversion={conversion} setConversion={setConversion}
            offerApproverEmail={offerApproverEmail} setOfferApproverEmail={setOfferApproverEmail} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => handleSave('COMPLETE')} disabled={isSubmitting}
              className="rounded bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white hover:opacity-80 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Create Offer'}
            </button>
            <button type="button" onClick={() => handleSave('PENDING')} disabled={isSubmitting}
              className="rounded border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)] disabled:opacity-50">
              Save as Pending
            </button>
            <button type="button" onClick={onClose}
              className="rounded border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--background)]">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

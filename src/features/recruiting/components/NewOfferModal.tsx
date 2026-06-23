'use client';

import { useState } from 'react';
import type { Candidate, Recruiter } from '../types';
import OfferFormFields from './OfferFormFields';

export default function NewOfferModal({ recruiters, onClose, onCreated }: {
  recruiters: Recruiter[];
  onClose: () => void;
  onCreated: (c: Candidate) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [recruiterId, setRecruiterId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryType, setSalaryType] = useState('');
  const [manager, setManager] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [equityShares, setEquityShares] = useState('');
  const [team, setTeam] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [conversion, setConversion] = useState(false);
  const [offerApproverEmail, setOfferApproverEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isComplete = !!(startDate && salary && salaryType && manager && officeLocation && team && employmentType);

  const handleSave = async (offerStat: 'PENDING' | 'COMPLETE') => {
    if (!name.trim()) { setError('Name is required'); return; }
    if (offerStat === 'COMPLETE' && !isComplete) { setError('All offer fields are required to create the offer'); return; }
    setIsSubmitting(true); setError('');
    try {
      const res = await fetch('/api/recruiting/candidates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), role: role || null, email: email || null, phone: phone || null,
          recruiterId: recruiterId || null, status: 'OFFER', offerStatus: offerStat,
          startDate: startDate || null, officeLocation: officeLocation || null,
          salary: salary ? Number(salary) : null, salaryType: salaryType || null, manager: manager || null,
          team: team || null, employmentType: employmentType || null, conversion,
          offerApproverEmail: offerApproverEmail || null,
          ...(equityShares ? { equityShares: Number(equityShares) } : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onCreated(data.data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create'); setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded bg-[var(--card-background)] p-6 shadow-md" onClick={e => e.stopPropagation()}>
        <h3 className="mb-5 text-xs font-black uppercase tracking-wide text-[var(--foreground)]">New Offer (Direct)</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Candidate name"
              className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Role</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Position"
              className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone"
                className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
            </div>
          </div>
          {recruiters.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Recruiter</label>
              <select value={recruiterId} onChange={e => setRecruiterId(e.target.value)}
                className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm">
                <option value="">None</option>
                {recruiters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
          <hr className="border-[var(--border)]" />
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--border-light)]">Offer Details</p>
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
              {isSubmitting ? 'Creating...' : 'Create Offer'}
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

'use client';

import { useState } from 'react';

interface Props {
  onCreated: () => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  'w-full border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs font-mono';
const labelClass =
  'mb-1 block text-[9px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]';

export default function AddMemberForm({ onCreated, onCancel }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [role, setRole] = useState('');
  const [team, setTeam] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [manager, setManager] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryType, setSalaryType] = useState('');
  const [equityShares, setEquityShares] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/team/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          startDate: startDate || null,
          role, team, officeLocation, manager,
          salary: salary === '' ? null : Number(salary),
          salaryType: salaryType || null,
          equityShares: equityShares === '' ? null : Number(equityShares),
        }),
      });
      const data = await res.json();
      if (data.success) {
        await onCreated();
        onCancel();
      } else { setError(data.error || 'Failed to create'); }
    } catch { setError('Failed to create'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mb-6 border border-[var(--border)] bg-[var(--card-background)] p-5">
      <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
        Use the email they&apos;ll sign in with (their @aspadeco.com address). Their row will merge automatically when they sign in.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="jdoe@aspadeco.com" className={inputClass} autoFocus />
        </div>
        <div>
          <label className={labelClass}>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Office</label>
          <input type="text" value={officeLocation} onChange={(e) => setOfficeLocation(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Team</label>
          <input type="text" value={team} onChange={(e) => setTeam(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Manager</label>
          <input type="text" value={manager} onChange={(e) => setManager(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="mt-4 border border-[var(--border-light)] bg-[var(--background)] p-3">
        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Compensation (optional)</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelClass}>Salary</label>
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <input type="text" value={salaryType} onChange={(e) => setSalaryType(e.target.value)} placeholder="annual / hourly" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Equity shares</label>
            <input type="number" value={equityShares} onChange={(e) => setEquityShares(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-[10px] text-red-700">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button type="button" disabled={saving || !email.trim()} onClick={submit}
          className="border border-[var(--border)] bg-[var(--foreground)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--background)] hover:opacity-80 disabled:opacity-30 transition-colors">
          {saving ? 'Adding…' : 'Add member'}
        </button>
        <button type="button" onClick={onCancel}
          className="border border-[var(--border)] bg-[var(--card-background)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

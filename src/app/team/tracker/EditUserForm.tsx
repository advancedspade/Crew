'use client';

import { useState } from 'react';
import { EMPLOYMENT_TYPE_OPTIONS, OFFICE_OPTIONS, SALARY_TYPE_OPTIONS, TEAM_OPTIONS, TrackerUser } from './types';

interface Props {
  user: TrackerUser;
  showSalary: boolean;
  onSaved: () => Promise<void>;
  managerOptions: { name: string; email: string }[];
}

const inputClass =
  'w-full border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs font-mono';
const labelClass =
  'mb-1 block text-[9px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]';

export default function EditUserForm({ user, showSalary, onSaved, managerOptions }: Props) {
  const [startDate, setStartDate] = useState(user.startDate ? user.startDate.slice(0, 10) : '');
  const [role, setRole] = useState(user.role || '');
  const [team, setTeam] = useState(user.team || '');
  const [officeLocation, setOfficeLocation] = useState(user.officeLocation || '');
  const [manager, setManager] = useState(user.manager || '');
  const [salary, setSalary] = useState(user.salary !== null ? String(user.salary) : '');
  const [salaryType, setSalaryType] = useState(user.salaryType || '');
  const [equityShares, setEquityShares] = useState(user.equityShares !== null ? String(user.equityShares) : '');
  const [employmentType, setEmploymentType] = useState(user.employmentType || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/team/tracker/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate || null,
          role, team, officeLocation, manager,
          salary: salary === '' ? null : Number(salary),
          salaryType: salaryType || null,
          equityShares: equityShares === '' ? null : Number(equityShares),
          employmentType: employmentType || null,
        }),
      });
      const data = await res.json();
      if (data.success) await onSaved();
      else setError(data.error || 'Failed to save');
    } catch { setError('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Office</label>
          <select value={officeLocation} onChange={(e) => setOfficeLocation(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {OFFICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Team</label>
          <select value={team} onChange={(e) => setTeam(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {TEAM_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            {team && !TEAM_OPTIONS.some((t) => t.value === team) && (
              <option value={team}>{team}</option>
            )}
          </select>
        </div>
        <div>
          <label className={labelClass}>Manager</label>
          <select value={manager} onChange={(e) => setManager(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {managerOptions.map((m) => (
              <option key={m.email} value={m.name}>{m.name} ({m.email})</option>
            ))}
            {manager && !managerOptions.some((m) => m.name === manager) && (
              <option value={manager}>{manager}</option>
            )}
          </select>
        </div>
        <div>
          <label className={labelClass}>Employment type</label>
          <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {EMPLOYMENT_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            {employmentType && !EMPLOYMENT_TYPE_OPTIONS.some((t) => t.value === employmentType) && (
              <option value={employmentType}>{employmentType}</option>
            )}
          </select>
        </div>
      </div>

      {showSalary ? (
        <div className="border border-[var(--border-light)] bg-[var(--background)] p-3">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Compensation (admin-only)</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelClass}>Salary</label>
              <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)} className={inputClass}>
                <option value="">—</option>
                {SALARY_TYPE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Equity shares</label>
              <input type="number" value={equityShares} onChange={(e) => setEquityShares(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[10px] uppercase tracking-wider text-[var(--border-light)]">Compensation hidden — toggle &quot;Show salary&quot; above to reveal.</p>
      )}

      {error && <p className="text-[10px] text-red-700">{error}</p>}

      <div className="flex items-center gap-2">
        <button type="button" disabled={saving} onClick={save}
          className="border border-[var(--border)] bg-[var(--foreground)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--background)] hover:opacity-80 disabled:opacity-30 transition-colors">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {user.candidateId && (
          <span className="text-[9px] uppercase tracking-wider text-[var(--border-light)]">linked to candidate</span>
        )}
      </div>
    </div>
  );
}

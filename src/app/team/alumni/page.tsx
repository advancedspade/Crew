'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageLoading from '@/components/PageLoading';
import { formatTenure } from '../tracker/types';

interface AlumniUser {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  team: string | null;
  officeLocation: string | null;
  manager: string | null;
  employmentType: string | null;
  startDate: string | null;
  endDate: string | null;
  endReason: string | null;
}

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/** Tenure between two dates (start → end), in the same short format as the tracker. */
function tenureBetween(startIso: string | null, endIso: string | null): string {
  if (!startIso || !endIso) return formatTenure(startIso);
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem} mo`;
  if (rem === 0) return `${years} yr`;
  return `${years} yr ${rem} mo`;
}

export default function AlumniPage() {
  const [users, setUsers] = useState<AlumniUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/team/tracker/alumni');
      const data = await res.json();
      if (data.success) setUsers(data.data);
      else setError(data.error || 'Failed to load');
    } catch { setError('Failed to load'); }
  }, []);

  useEffect(() => { load().finally(() => setIsLoading(false)); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.name || '').toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (u.team || '').toLowerCase().includes(q)
      || (u.role || '').toLowerCase().includes(q)
      || (u.endReason || '').toLowerCase().includes(q));
  }, [users, search]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--foreground)]">Alumni</h2>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{users.length} former team member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/team/tracker"
            className="border border-[var(--border)] bg-[var(--card-background)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors shrink-0">
            ← Tracker
          </Link>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, reason…"
            className="border border-[var(--border)] bg-[var(--card-background)] px-3 py-1.5 text-[11px] w-56" />
        </div>
      </div>

      {error && <p className="mb-3 text-xs text-red-700">{error}</p>}

      {filtered.length === 0 ? (
        <div className="border border-dashed border-[var(--border-light)] bg-[var(--card-background)] p-10 text-center">
          <p className="text-[11px] uppercase tracking-wider text-[var(--border-light)]">No alumni yet</p>
        </div>
      ) : (
        <div className="border border-[var(--border)]">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] gap-3 border-b border-[var(--border)] bg-[var(--card-background)] px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            <div>Name</div>
            <div>Role / Team</div>
            <div>Tenure</div>
            <div>Start</div>
            <div>End</div>
            <div>Reason</div>
          </div>
          {filtered.map((u) => (
            <div key={u.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] gap-3 border-t border-[var(--border-light)] px-4 py-3 text-[11px] font-mono">
              <div>
                <div className="font-black uppercase tracking-wider text-[var(--foreground)]">{u.name || u.email.split('@')[0]}</div>
                <div className="text-[10px] text-[var(--text-secondary)]">{u.email}</div>
                {u.employmentType && (
                  <div className="mt-1 inline-block border border-[var(--border-light)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">{u.employmentType}</div>
                )}
              </div>
              <div className="text-[var(--text-secondary)]">
                <div>{u.role || '—'}</div>
                <div className="text-[10px]">{u.team || '—'}{u.officeLocation ? ` · ${u.officeLocation}` : ''}</div>
                {u.manager && <div className="text-[10px]">mgr: {u.manager}</div>}
              </div>
              <div>{tenureBetween(u.startDate, u.endDate)}</div>
              <div className="text-[var(--text-secondary)]">{fmtDate(u.startDate)}</div>
              <div className="text-[var(--text-secondary)]">{fmtDate(u.endDate)}</div>
              <div className="text-[var(--text-secondary)]">{u.endReason || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

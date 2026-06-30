'use client';

import { useState, useEffect } from 'react';
import type { Candidate } from '../_components/types';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recruiting/candidates/interview')
      .then(r => r.json())
      .then(d => { if (d.success) setCandidates(d.data); })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-xs text-[var(--text-secondary)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 border-b border-[var(--border)] pb-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--foreground)]">Candidates</h2>
        <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Candidates currently in the interview stage</p>
      </div>

      {candidates.length === 0 ? (
        <p className="py-12 text-center text-xs text-[var(--text-secondary)]">No candidates in interview stage right now.</p>
      ) : (
        <div className="overflow-x-auto border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--card-background)]">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Name</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Role</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">LinkedIn</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Resume</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map(c => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--hover)]">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{c.role || '—'}</td>
                  <td className="px-4 py-3">
                    {c.linkedin ? (
                      <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--foreground)] underline hover:no-underline">
                        Profile ↗
                      </a>
                    ) : (
                      <span className="text-[var(--border-light)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.resumeDriveFileId ? (
                      <a href={`/api/recruiting/candidates/${c.id}/resume`} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--foreground)] underline hover:no-underline">
                        {c.resumeFileName || 'View'} ↗
                      </a>
                    ) : (
                      <span className="text-[var(--border-light)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef } from 'react';
import type { Candidate } from '../types';

export default function CandidateCard({ c, onClick, onEdit, onDelete, muted, draggable: isDraggable }: {
  c: Candidate; onClick: () => void; onEdit: () => void; onDelete: () => void; muted?: boolean; draggable?: boolean;
}) {
  const didDrag = useRef(false);
  return (
    <div
      onClick={() => { if (!didDrag.current) onClick(); didDrag.current = false; }}
      onMouseDown={() => { didDrag.current = false; }}
      onDragStart={(e) => { if (isDraggable) { didDrag.current = true; e.dataTransfer.setData('text/plain', c.id); } }}
      onDragEnd={() => { setTimeout(() => { didDrag.current = false; }, 0); }}
      draggable={isDraggable}
      className={`border border-[var(--border)] p-3 cursor-pointer ${isDraggable ? 'active:cursor-grabbing' : ''} ${muted ? 'opacity-60' : ''} ${c.status === 'OFFER' && c.offerStatus === 'APPROVED' ? 'border-green-400 bg-green-50' : ''}`}>
      <div className="flex items-start justify-between">
        <p className="font-semibold text-sm text-[var(--foreground)] hover:underline">{c.name}</p>
        <div className="flex items-center gap-0.5 ml-2 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-[var(--border-light)] hover:bg-[var(--background)] hover:text-[var(--foreground)]" title="Edit">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-[var(--border-light)] hover:bg-red-50 hover:text-red-500" title="Delete">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        </div>
      </div>
      {c.role && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{c.role}</p>}
      {c.status === 'OFFER' && c.offerStatus === 'PENDING' && (
        <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Pending</span>
      )}
      {c.status === 'OFFER' && c.offerStatus === 'APPROVED' && (
        <span className="mt-1 inline-block rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">Approved</span>
      )}
      {(c.recruiterName || c.recruiter) && <p className="mt-1 text-[10px] text-[var(--border-light)]">{c.recruiterName || c.recruiter?.name}</p>}
      {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="mt-0.5 flex items-center gap-1 text-[10px] text-blue-500 hover:underline">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
        LinkedIn
      </a>}
    </div>
  );
}

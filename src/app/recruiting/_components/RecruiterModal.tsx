'use client';

export default function RecruiterModal({ name, setName, onAdd, onClose }: { name: string; setName: (s: string) => void; onAdd: () => void; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded bg-[var(--card-background)] p-6 shadow-md" onClick={e => e.stopPropagation()}>
        <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-[var(--foreground)]">Add Recruiter</h3>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="mb-3 w-full rounded border border-[var(--border)] px-3 py-2 text-sm" autoFocus />
        <div className="flex gap-2">
          <button onClick={onAdd} disabled={!name.trim()} className="rounded bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white hover:opacity-80 disabled:opacity-50">Add</button>
          <button onClick={onClose} className="rounded border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--background)]">Cancel</button>
        </div>
      </div>
    </div>
  );
}

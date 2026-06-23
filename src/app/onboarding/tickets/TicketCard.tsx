'use client';

import { useState } from 'react';
import type { Ticket, TeamMember, ChecklistItemState } from './page';
import { applicableChecklist, type ChecklistItemDef } from '@/lib/onboarding-tickets';

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '—';

function daysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function TicketCard({ ticket, team, onUpdate, expanded, onToggleExpand, nameFor }: {
  ticket: Ticket;
  team: TeamMember[];
  onUpdate: (id: string, patch: Record<string, unknown>) => Promise<void>;
  expanded: boolean;
  onToggleExpand: () => void;
  nameFor: (email: string | null) => string;
}) {
  const [workEmail, setWorkEmail] = useState(ticket.candidate.workEmail || '');
  const [notes, setNotes] = useState(ticket.candidate ? (ticket.notes || '') : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isDone = ticket.status === 'DONE';
  const isDeel = ticket.type === 'DEEL_EMAIL';

  const checklistDefs = applicableChecklist(ticket.type, ticket.candidate);
  const checklistState = (ticket.data?.checklist || {}) as Record<string, ChecklistItemState>;
  const resolvedCount = checklistDefs.filter((d) => checklistState[d.key]?.completedAt || checklistState[d.key]?.naAt).length;

  const dueDays = daysUntilDue(ticket.dueDate);
  const overdue = !isDone && dueDays !== null && dueDays < 0;
  const dueSoon = !isDone && dueDays !== null && dueDays >= 0 && dueDays <= 3;

  const saveAssignee = async (next: string) => {
    if (next === (ticket.assigneeEmail || '')) return;
    setBusy(true); setError('');
    try { await onUpdate(ticket.id, { assigneeEmail: next || null }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };
  const saveNotes = async () => {
    if (notes === (ticket.notes || '')) return;
    setBusy(true); setError('');
    try { await onUpdate(ticket.id, { notes: notes || null }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };
  const toggleChecklistItem = async (key: string, completed: boolean, meta?: Record<string, string>) => {
    setBusy(true); setError('');
    try { await onUpdate(ticket.id, { checklistKey: key, checklistCompleted: completed, ...(meta ? { checklistMeta: meta } : {}) }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };
  const markChecklistNA = async (key: string, na: boolean) => {
    setBusy(true); setError('');
    try { await onUpdate(ticket.id, { checklistKey: key, checklistNA: na, checklistCompleted: false }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };
  const markDone = async () => {
    setBusy(true); setError('');
    try {
      if (isDeel) {
        if (!workEmail.trim()) { setError('Work email required'); setBusy(false); return; }
        await onUpdate(ticket.id, { status: 'DONE', workEmail: workEmail.trim() });
      } else { await onUpdate(ticket.id, { status: 'DONE' }); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };
  const reopen = async () => {
    setBusy(true); setError('');
    try { await onUpdate(ticket.id, { status: 'OPEN' }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };

  /* ── Compact card (collapsed) ── */
  if (!expanded) {
    return (
      <button type="button" onClick={onToggleExpand}
        className={`w-full rounded border px-3 py-2 text-left transition-colors hover:bg-[#FAFAFA] ${isDone ? 'border-[#E5E5E5] opacity-60' : overdue ? 'border-red-300' : 'border-[#E5E5E5]'}`}>
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-xs font-semibold text-[#1A1A1A]">{ticket.candidate.name}</p>
          {isDone && <span className="flex-shrink-0 rounded bg-[#1A1A1A] px-1 py-0.5 text-[9px] font-bold text-white">✓</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#999]">
          {ticket.assigneeEmail && <span className="truncate">{nameFor(ticket.assigneeEmail)}</span>}
          {ticket.dueDate && <span className={overdue ? 'font-medium text-red-600' : dueSoon ? 'text-orange-600' : ''}>{overdue ? 'Overdue' : fmtDate(ticket.dueDate)}</span>}
          {checklistDefs.length > 0 && <span>{resolvedCount}/{checklistDefs.length}</span>}
        </div>
      </button>
    );
  }

  /* ── Expanded card ── */
  return (
    <div className={`rounded border bg-white ${isDone ? 'border-[#E5E5E5] opacity-70' : overdue ? 'border-red-300' : 'border-[#D4D4D4]'}`}>
      {/* Header */}
      <button type="button" onClick={onToggleExpand} className="flex w-full items-center justify-between gap-2 px-3 py-2 hover:bg-[#FAFAFA]">
        <p className="truncate text-xs font-bold text-[#1A1A1A]">{ticket.candidate.name}</p>
        <span className="text-[10px] text-[#999]">▲</span>
      </button>

      <div className="border-t border-[#F0F0F0] px-3 py-2 space-y-2">
        {/* Info row */}
        <p className="text-[10px] text-[#999]">{ticket.candidate.role || '—'} · Start {fmtDate(ticket.candidate.startDate)}</p>

        {/* Personal email — always shown */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#999]">Personal email</span>
          <p className="text-xs text-[#1A1A1A]">{ticket.candidate.email || '—'}</p>
        </div>

        {/* Work email — shown on all non-Deel tickets (read-only) or editable on Deel */}
        {isDeel ? (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#999]">
              <a href="https://admin.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Work email</a> *
            </label>
            <input type="email" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)}
              disabled={busy || isDone} placeholder="first.last@advancedspadecompany.com"
              className="mt-0.5 w-full rounded border border-[#D4D4D4] px-2 py-1 text-xs disabled:bg-[#F5F5F5]" />
          </div>
        ) : (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#999]">Work email</span>
            <p className="text-xs text-[#1A1A1A]">{ticket.candidate.workEmail || '—'}</p>
          </div>
        )}

        {/* Assignee */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#999]">Assignee</label>
          <select value={ticket.assigneeEmail || ''} onChange={(e) => saveAssignee(e.target.value)}
            disabled={busy || isDone}
            className="mt-0.5 w-full rounded border border-[#D4D4D4] bg-white px-2 py-1 text-xs disabled:bg-[#F5F5F5]">
            <option value="">Unassigned</option>
            {team.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
            {ticket.assigneeEmail && !team.find((m) => m.email === ticket.assigneeEmail) && (
              <option value={ticket.assigneeEmail}>{ticket.assigneeEmail}</option>
            )}
          </select>
        </div>
        {/* Checklist */}
        {checklistDefs.length > 0 && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#999]">Checklist</span>
            <div className="mt-0.5 space-y-1">
              {checklistDefs.map((def) => (
                <ChecklistRow key={def.key} def={def} state={checklistState[def.key]} disabled={busy || isDone} onToggle={toggleChecklistItem} onNA={markChecklistNA} />
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#999]">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes}
            disabled={busy || isDone} rows={2} placeholder="Add notes..."
            className="mt-0.5 w-full rounded border border-[#D4D4D4] px-2 py-1 text-xs disabled:bg-[#F5F5F5]" />
        </div>

        {error && <p className="text-[10px] text-red-600">{error}</p>}

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-[#F0F0F0] pt-2">
          {!isDone ? (
            <button type="button" onClick={markDone} disabled={busy}
              className="rounded bg-[#1A1A1A] px-2 py-1 text-[10px] font-medium text-white hover:bg-[#333] disabled:opacity-50">
              Mark done
            </button>
          ) : (
            <button type="button" onClick={reopen} disabled={busy}
              className="rounded border border-[#D4D4D4] bg-white px-2 py-1 text-[10px] font-medium text-[#1A1A1A] hover:bg-[#F5F5F5] disabled:opacity-50">
              Reopen
            </button>
          )}
          {ticket.completedBy && isDone && <span className="text-[9px] text-[#999]">by {ticket.completedBy}</span>}
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({ def, state, disabled, onToggle, onNA }: {
  def: ChecklistItemDef;
  state: ChecklistItemState | undefined;
  disabled: boolean;
  onToggle: (key: string, completed: boolean, meta?: Record<string, string>) => void;
  onNA: (key: string, na: boolean) => void;
}) {
  const completed = !!state?.completedAt;
  const isNA = !!state?.naAt;
  const resolved = completed || isNA;
  const [metaValues, setMetaValues] = useState<Record<string, string>>(state?.meta || {});
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    if (completed) { onToggle(def.key, false); }
    else if (def.metaFields) {
      if (!expanded) { setExpanded(true); return; }
      onToggle(def.key, true, metaValues);
      setExpanded(false);
    } else { onToggle(def.key, true); }
  };

  const handleNA = () => {
    if (isNA) { onNA(def.key, false); }
    else { onNA(def.key, true); }
  };

  return (
    <div className="rounded border border-[#F0F0F0] px-2 py-1">
      <div className="flex items-center gap-1.5">
        <input type="checkbox" checked={completed} onChange={handleToggle} disabled={disabled || isNA}
          className="h-3 w-3 flex-shrink-0 rounded border-[#D4D4D4]" />
        {def.link ? (
          <a href={def.link} target="_blank" rel="noopener noreferrer" className={`text-xs underline ${resolved ? 'text-[#999] line-through' : 'text-blue-600 hover:text-blue-800'}`}>{def.label}</a>
        ) : (
          <span className={`text-xs ${isNA ? 'text-[#999] italic line-through' : completed ? 'text-[#999] line-through' : 'text-[#1A1A1A]'}`}>{def.label}</span>
        )}
        {isNA && <span className="rounded bg-[#F0F0F0] px-1 py-0.5 text-[9px] font-bold text-[#999]">N/A</span>}
        {completed && state?.completedBy && <span className="text-[9px] text-[#999]">— {state.completedBy}</span>}
        {def.allowNA && !disabled && (
          <button type="button" onClick={handleNA}
            className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${isNA ? 'bg-[#E5E5E5] text-[#6B6B6B]' : 'text-[#999] hover:bg-[#F0F0F0]'}`}>
            {isNA ? 'Undo N/A' : 'N/A'}
          </button>
        )}
      </div>
      {def.metaFields && (expanded || completed) && (
        <div className="ml-5 mt-1 grid grid-cols-2 gap-1.5">
          {def.metaFields.map((mf) => (
            <div key={mf.key}>
              <label className="block text-[9px] font-medium text-[#999]">{mf.label}</label>
              <input type="text" value={metaValues[mf.key] || ''} disabled={disabled || completed}
                onChange={(e) => setMetaValues((prev) => ({ ...prev, [mf.key]: e.target.value }))}
                className="w-full rounded border border-[#E5E5E5] px-1 py-0.5 text-[10px] disabled:bg-[#F5F5F5]" />
            </div>
          ))}
          {!completed && expanded && (
            <div className="col-span-full">
              <button type="button" onClick={handleToggle} disabled={disabled}
                className="rounded bg-[#1A1A1A] px-2 py-0.5 text-[9px] font-medium text-white hover:bg-[#333] disabled:opacity-50">Save & complete</button>
              <button type="button" onClick={() => setExpanded(false)}
                className="ml-1 text-[9px] text-[#999] hover:text-[#1A1A1A]">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

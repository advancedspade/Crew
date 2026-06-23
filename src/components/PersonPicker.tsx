'use client';

import { useEffect, useState } from 'react';

interface TeamMember { email: string; name: string }

interface PersonPickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  team?: TeamMember[];
}

let directoryCache: TeamMember[] | null = null;
let directoryPromise: Promise<TeamMember[]> | null = null;

function fetchDirectory(): Promise<TeamMember[]> {
  if (directoryCache) return Promise.resolve(directoryCache);
  if (directoryPromise) return directoryPromise;
  directoryPromise = fetch('/api/team-directory')
    .then((r) => r.json())
    .then((d) => {
      const list: TeamMember[] = d.success
        ? d.data.map((m: { email: string; name: string }) => ({ email: m.email, name: m.name }))
        : [];
      directoryCache = list;
      return list;
    })
    .catch(() => []);
  return directoryPromise;
}

export default function PersonPicker({ value, onChange, placeholder, className, team }: PersonPickerProps) {
  const [members, setMembers] = useState<TeamMember[]>(team || []);
  const [mode, setMode] = useState<'pick' | 'custom'>(() => {
    if (!value) return 'pick';
    if (team && team.some((m) => m.email === value)) return 'pick';
    return value.includes('@') ? 'pick' : 'custom';
  });

  useEffect(() => {
    if (team && team.length > 0) {
      setMembers(team);
      return;
    }
    fetchDirectory().then(setMembers);
  }, [team]);

  useEffect(() => {
    if (!value) return;
    const isEmail = value.includes('@');
    if (isEmail) {
      if (members.length > 0 && !members.some((m) => m.email === value)) {
        setMode('custom');
      }
    } else {
      setMode('custom');
    }
  }, [value, members]);

  const baseClass = className || 'w-full rounded border border-[#D4D4D4] px-3 py-2 text-sm';

  if (mode === 'custom') {
    return (
      <div className="space-y-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Type a name'}
          className={baseClass}
        />
        <button
          type="button"
          onClick={() => { onChange(''); setMode('pick'); }}
          className="text-[11px] text-[#6B6B6B] underline hover:no-underline"
        >
          Pick from team directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
      >
        <option value="">{placeholder || 'Select...'}</option>
        {members.map((m) => (
          <option key={m.email} value={m.email}>{m.name}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setMode('custom')}
        className="text-[11px] text-[#6B6B6B] underline hover:no-underline"
      >
        Type a custom name instead
      </button>
    </div>
  );
}

export function resolvePersonName(value: string | null | undefined, team: TeamMember[]): string {
  if (!value) return '';
  const match = team.find((m) => m.email === value);
  return match ? match.name : value;
}

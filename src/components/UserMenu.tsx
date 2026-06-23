'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) {
    return <div className="w-20" />;
  }

  const { name, email, image } = session.user;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        {image ? (
          <Image
            src={image}
            alt={name || 'User'}
            width={24}
            height={24}
            className="h-6 w-6 object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center bg-[var(--foreground)] text-[10px] font-black text-[var(--background)]">
            {(name || email || '?')[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 border border-[var(--border)] bg-[var(--card-background)] z-50">
          <div className="border-b border-[var(--border-light)] px-4 py-3">
            {name && (
              <p className="text-[11px] font-black uppercase tracking-wider text-[var(--foreground)] truncate">{name}</p>
            )}
            {email && (
              <p className="text-[10px] text-[var(--text-secondary)] truncate">{email}</p>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

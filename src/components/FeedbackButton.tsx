'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import FeedbackModal from '@/components/FeedbackModal';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { status } = useSession();

  if (status !== 'authenticated') return null;
  if (pathname.startsWith('/auth')) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-30 border-2 border-[var(--border)] bg-[var(--foreground)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--background)] hover:opacity-80"
      >
        Feedback
      </button>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

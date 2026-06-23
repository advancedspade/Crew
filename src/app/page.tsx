'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type NavItem = { href: string; label: string; adminOnly?: boolean };

const NAV: NavItem[] = [
  { href: '/recruiting', label: 'Recruiting Pipeline', adminOnly: true },
  { href: '/recruiting/candidates', label: 'Candidates' },
  { href: '/recruiting/roles', label: 'Roles' },
  { href: '/recruiting/feedback', label: 'Interview Feedback' },
  { href: '/onboarding', label: 'Onboarding', adminOnly: true },
  { href: '/onboarding/tickets', label: 'Onboarding Tickets', adminOnly: true },
  { href: '/team', label: 'Team Directory' },
  { href: '/referrals', label: 'Referrals' },
];

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setIsAdmin(d?.success ? !!d.data.isAdmin : false))
      .catch(() => setIsAdmin(false));
  }, []);

  const visible = NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="px-5 py-8">
      <h1 className="text-2xl font-black uppercase tracking-[0.15em] mb-6">Crew</h1>
      <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
        {isAdmin === null
          ? null
          : visible.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block border-2 border-[var(--border)] bg-[var(--card-background)] p-4 font-mono text-sm uppercase tracking-wider hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
      </nav>
    </div>
  );
}

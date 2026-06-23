import Link from 'next/link';

const NAV = [
  { href: '/recruiting', label: 'Recruiting' },
  { href: '/recruiting/candidates', label: 'Candidates' },
  { href: '/recruiting/roles', label: 'Roles' },
  { href: '/recruiting/feedback', label: 'Interview Feedback' },
  { href: '/onboarding', label: 'Onboarding' },
  { href: '/onboarding/tickets', label: 'Onboarding Tickets' },
  { href: '/team', label: 'Team Directory' },
  { href: '/referrals', label: 'Referrals' },
];

export default function HomePage() {
  return (
    <div className="px-5 py-8">
      <h1 className="text-2xl font-black uppercase tracking-[0.15em] mb-6">Crew</h1>
      <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
        {NAV.map((item) => (
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

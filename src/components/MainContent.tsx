'use client';

export default function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="pt-12">
      {children}
    </main>
  );
}

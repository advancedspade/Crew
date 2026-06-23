'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Spinner from '@/components/Spinner';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const messages: Record<string, string> = {
    AccessDenied: 'Your email is not authorized to access this application.',
    Configuration: 'There is a problem with the server configuration.',
    Default: 'An error occurred during sign in.',
  };

  const message = messages[error || ''] || messages.Default;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm border border-[#D4D4D4] bg-white p-8 text-center">
        <h2 className="text-xs font-black uppercase tracking-widest text-red-600">
          Access Denied
        </h2>
        <p className="mt-3 mb-6 text-sm text-[#666]">{message}</p>
        <Link
          href="/auth/signin"
          className="inline-block w-full bg-[#1A1A1A] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#333]"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><Spinner size={32} /></div>}>
      <ErrorContent />
    </Suspense>
  );
}

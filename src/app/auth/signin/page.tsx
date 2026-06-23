'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm border border-[var(--border)] bg-[var(--card-background)] p-8 text-center">
        <Image
          src="/spade-logo-filled.svg"
          alt="ASC Logo"
          width={56}
          height={48}
          className="mx-auto mb-4 h-12 w-auto"
        />
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--foreground)]">
          Advanced Spade Company
        </h2>
        <p className="mt-2 mb-6 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Sign in to continue</p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="flex w-full items-center justify-center gap-3 border border-[var(--border)] bg-[var(--card-background)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

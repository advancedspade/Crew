import { NextResponse } from 'next/server';

/**
 * Returns a 401/403 NextResponse when the email is not an admin, or null when allowed.
 * Admins are configured via the RECRUITING_EMAILS env var (comma-separated).
 */
export function requireAdmin(email: string | null | undefined): NextResponse | null {
  if (!email) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
  const adminEmails = (process.env.RECRUITING_EMAILS || '')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (adminEmails.length === 0) return null;
  if (!adminEmails.includes(email.toLowerCase())) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

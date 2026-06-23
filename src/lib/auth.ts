import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/db';

/**
 * Allowed emails — comma-separated list in ALLOWED_EMAILS env var.
 * Supports specific emails and domain wildcards:
 *   e.g. "abby@gmail.com,*@aspadeco.com"
 */
function getAllowedEntries(): string[] {
  const raw = process.env.ALLOWED_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isEmailAllowed(email: string): boolean {
  const entries = getAllowedEntries();
  if (entries.length === 0) return true; // no allowlist = allow all (local dev)
  const lower = email.toLowerCase();
  return entries.some((entry) => {
    if (entry.startsWith('*@')) {
      // Domain wildcard: *@aspadeco.com matches anyone@aspadeco.com
      return lower.endsWith(entry.slice(1)); // entry.slice(1) = "@aspadeco.com"
    }
    return lower === entry;
  });
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowed = isEmailAllowed(user.email || '');
      if (allowed && user.email) {
        // Track login in database (fire-and-forget)
        prisma.appUser.upsert({
          where: { email: user.email.toLowerCase() },
          update: { name: user.name || undefined, image: user.image || undefined, lastLogin: new Date() },
          create: { email: user.email.toLowerCase(), name: user.name || null, image: user.image || null },
        }).catch((err) => console.error('Failed to track login:', err));
      }
      return allowed;
    },
    async jwt({ token, account }) {
      // On initial sign-in, store the tokens
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;
      }
      // Return token if it hasn't expired
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }
      // Refresh the token
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as unknown as Record<string, unknown>).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + data.expires_in * 1000,
      refreshToken: data.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

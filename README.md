# Crew

People / HR application for aSpade. Covers hiring through long-term team management — recruiting pipeline, offer letters, onboarding tickets and tasks, team directory, FAQ, referrals, and a tenure/check-in tracker.

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 · PostgreSQL (Supabase) · NextAuth (Google) · Tailwind v4.

## Local setup

```bash
nvm use 20            # Node 20+
npm install
cp .env.example .env  # fill in values (see below)
npx prisma generate
npm run dev           # http://localhost:3002
```

### Required env vars

| Var | Notes |
| --- | --- |
| `DATABASE_URL` | Supabase pooled URL (port 6543, pgbouncer) |
| `DIRECT_URL` | Supabase direct URL (port 5432) — used by Prisma for migrations |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3002` in dev, prod domain in prod |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials |
| `ALLOWED_EMAILS` | Comma-separated allowlist. Supports `*@aspadeco.com` wildcard. Leave blank in dev. |
| `RECRUITING_EMAILS` | Comma-separated admin allowlist. Empty = everyone is admin (use only in dev). |

Optional: `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, and a set of `SLACK_*_WEBHOOK_URL` vars for notifications. Each missing webhook is silently skipped. Full list in `.env.example`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server on port 3002 |
| `npm run build` | `prisma generate && next build` |
| `npm run start` | Production server on port 3002 |
| `npm run lint` | ESLint 9 flat config (`eslint-config-next`) |
| `npm run typecheck` | `tsc --noEmit` |

## Architecture

```
src/
├── app/                       # Next.js App Router
│   ├── api/                   # All API routes (route.ts files)
│   ├── auth/                  # Sign-in / error pages
│   ├── faq/                   # Public FAQ + /faq/admin
│   ├── onboarding/            # New-hire onboarding (admin-only)
│   ├── recruiting/            # Pipeline (admin) + /recruiting/{candidates,roles,feedback} (open)
│   │   └── _components/       # Co-located UI for the recruiting pages
│   ├── referrals/             # Public referral submissions
│   ├── team/                  # Team directory + /team/tracker (admin)
│   ├── layout.tsx             # Root layout (header, theme init, AuthProvider)
│   └── page.tsx               # Home dashboard
├── components/                # Shared UI (PageLoading, PersonPicker, etc.)
├── lib/
│   ├── admin-auth.ts          # requireAdmin() — single source of truth for admin gating
│   ├── auth.ts                # NextAuth config (Google + AppUser upsert + candidate linking)
│   ├── db.ts                  # Prisma singleton
│   ├── onboarding-tickets.ts  # Ticket config + Slack notifications
│   └── team-tracker.ts        # Tracker helpers (linking, normalization)
└── middleware.ts              # Route gating (ALLOWED_EMAILS + RECRUITING_EMAILS)
```

### Data model (Prisma)

- `AppUser` — one row per real signed-in person; source of truth post-hire.
- `Candidate` — pre-hire artifact. Linked to `AppUser` by work email when they first sign in. Snapshot fields (start date, role, salary, etc.) only copy from `Candidate → AppUser` when the AppUser side is empty.
- `Checkin` — chronological event log hanging off `AppUser` (used by the Team Tracker).
- `Role`, `Recruiter`, `InterviewFeedback`, `OnboardingTicket`, `OnboardingTask`, `Referral`, `Faq`, `Feedback`.

See `prisma/schema.prisma` for the full schema. Migrations live in `prisma/migrations/` (plus `prisma/migrations/manual/` for SQL that needs to be applied directly to Supabase).

### Admin gating

Two layers, both keyed off the `RECRUITING_EMAILS` env var:

1. **Middleware** (`src/middleware.ts`) — blocks navigation to admin-only pages and APIs.
2. **API handlers** — call `requireAdmin(session?.user?.email)` from `src/lib/admin-auth.ts` as a defence-in-depth check.

Admin-only surfaces: `/recruiting` (pipeline), `/onboarding`, `/team/tracker`, `/faq/admin`, and the matching `/api/*` routes. Open-to-all surfaces inside `/recruiting` are explicitly allowlisted in the middleware (e.g. `/recruiting/candidates`, `/recruiting/feedback`, `/recruiting/roles`).

## Deploy

Two supported targets, both fed from the same `main` branch:

- **Vercel** (current production). `vercel.json` configures the cron for `/api/cron/onboarding-tickets`. Just connect the repo and set env vars.
- **Google Cloud Run** (migration-ready). `Dockerfile` builds a standalone Next.js image. Cloud SQL + Secret Manager + Cloud Scheduler runbook in [`DEPLOY_GCP.md`](./DEPLOY_GCP.md).

`next.config.ts` has `output: 'standalone'` — required by the Cloud Run image, ignored by Vercel.

## Design conventions

- **Brutalist UI**: `font-mono` for labels, square corners enforced globally (`* { border-radius: 0 !important; }` in `globals.css`), high contrast, CSS vars for the light/dark palette.
- **Theme**: `ThemeToggle` persists choice in `localStorage`; an anti-FOUC script in `layout.tsx` applies it before paint.
- **Loading states**: use the shared `PageLoading` component (centered spinner with `py-20` wrapper).
- **Office locations**: unified set across the app — Long Beach (LB), Las Vegas (Vegas), NorCal, Remote.
- **Team values**: tracker uses `BizOps | Hardware | Software | Field`. Legacy short codes (HW/SW/Ops) from the recruiting side are normalized in `lib/team-tracker.ts` on copy.

## Where to look first

- New feature, admin-only: add the route, gate it in `src/middleware.ts`, call `requireAdmin` in the API handler.
- Adding a Slack notification: copy the pattern from `src/lib/onboarding-tickets.ts` — always read the webhook from env and silently skip if unset.
- Schema change: edit `prisma/schema.prisma`, run `npx prisma generate`, then either `npx prisma db push` (dev) or write a migration SQL file under `prisma/migrations/manual/` to run against Supabase.

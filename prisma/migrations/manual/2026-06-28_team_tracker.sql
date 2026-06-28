-- Team Tracker: extend AppUser + new Checkin table
-- Run in Supabase SQL editor.

-- 1. Enum for the kind of "people event" being logged.
CREATE TYPE "CheckinType" AS ENUM ('CHECK_IN', 'SALARY_CHANGE', 'PROMOTION', 'NOTE');

-- 2. New columns on AppUser. All nullable so existing rows aren't disturbed.
ALTER TABLE "AppUser"
  ADD COLUMN "candidateId"    TEXT,
  ADD COLUMN "startDate"      TIMESTAMP(3),
  ADD COLUMN "role"           TEXT,
  ADD COLUMN "team"           TEXT,
  ADD COLUMN "officeLocation" TEXT,
  ADD COLUMN "manager"        TEXT,
  ADD COLUMN "salary"         DOUBLE PRECISION,
  ADD COLUMN "salaryType"     TEXT,
  ADD COLUMN "equityShares"   DOUBLE PRECISION;

-- 3. One-to-one link to Candidate via workEmail snapshot.
CREATE UNIQUE INDEX "AppUser_candidateId_key" ON "AppUser"("candidateId");
CREATE INDEX        "AppUser_team_idx"        ON "AppUser"("team");
ALTER TABLE "AppUser"
  ADD CONSTRAINT "AppUser_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Checkin table — the "people events" log. Any entry resets the
--    "days since last check-in" counter on the tracker.
CREATE TABLE "Checkin" (
  "id"        TEXT          NOT NULL,
  "userId"    TEXT          NOT NULL,
  "type"      "CheckinType" NOT NULL DEFAULT 'CHECK_IN',
  "loggedBy"  TEXT          NOT NULL,
  "loggedAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Checkin_userId_idx"   ON "Checkin"("userId");
CREATE INDEX "Checkin_loggedAt_idx" ON "Checkin"("loggedAt");

ALTER TABLE "Checkin"
  ADD CONSTRAINT "Checkin_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

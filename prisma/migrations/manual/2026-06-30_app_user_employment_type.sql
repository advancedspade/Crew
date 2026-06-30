-- Team Tracker: add employmentType to AppUser so interns / part-time / seasonal
-- show up alongside the existing Candidate snapshot fields.
-- Run in Supabase SQL editor.

ALTER TABLE "AppUser"
  ADD COLUMN IF NOT EXISTS "employmentType" TEXT;

-- Backfill from linked Candidate where possible.
UPDATE "AppUser" u
SET "employmentType" = c."employmentType"
FROM "Candidate" c
WHERE u."candidateId" = c."id"
  AND u."employmentType" IS NULL
  AND c."employmentType" IS NOT NULL;

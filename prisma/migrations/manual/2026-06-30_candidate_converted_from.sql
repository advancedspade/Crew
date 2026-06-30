-- Recruiting: link an intern→FT conversion offer back to the original intern
-- Candidate record so we can show "Converted from / to" on both sides.
-- Run in Supabase SQL editor.

ALTER TABLE "Candidate"
  ADD COLUMN IF NOT EXISTS "convertedFromCandidateId" TEXT;

ALTER TABLE "Candidate"
  DROP CONSTRAINT IF EXISTS "Candidate_convertedFromCandidateId_fkey";
ALTER TABLE "Candidate"
  ADD CONSTRAINT "Candidate_convertedFromCandidateId_fkey"
  FOREIGN KEY ("convertedFromCandidateId")
  REFERENCES "Candidate"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Candidate_convertedFromCandidateId_idx"
  ON "Candidate" ("convertedFromCandidateId");

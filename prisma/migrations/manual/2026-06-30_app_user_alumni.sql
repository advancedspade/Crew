-- Team Tracker: track former employees (alumni) on AppUser.
-- endDate marks when they left; endReason is a free-text label (e.g. "Departed",
-- "Converted to FT", "Internship ended").  Run in Supabase SQL editor.

ALTER TABLE "AppUser"
  ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "endReason" TEXT;

-- Backfill: normalize legacy team codes on AppUser to the tracker's canonical labels.
-- Recruiting (Candidate) keeps the short codes (HW/SW/Ops) since RoleModal and
-- recruiting filters depend on them. Only AppUser is touched here.
-- Run in Supabase SQL editor.

UPDATE "AppUser" SET "team" = 'Hardware' WHERE "team" = 'HW';
UPDATE "AppUser" SET "team" = 'Software' WHERE "team" = 'SW';
UPDATE "AppUser" SET "team" = 'BizOps'   WHERE "team" = 'Ops';

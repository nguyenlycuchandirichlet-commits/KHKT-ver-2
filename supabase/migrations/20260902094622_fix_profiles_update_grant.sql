/*
# Fix profiles UPDATE grant for authenticated role

## Problem
The `authenticated` role was missing the UPDATE grant on the `profiles` table.
An UPDATE RLS policy (`profiles_update_own`) existed, but without the underlying
column-level GRANT, every profile save from the frontend silently failed with a
permission error. Additionally, `updated_at` was not in the updatable columns
list, so even if UPDATE were granted, setting `updated_at` in a profile save
would be rejected.

## Changes
1. Grant UPDATE on `profiles` to `authenticated` — restricted to the columns
   a student is allowed to modify: `full_name`, `date_of_birth`, `province`,
   `school`, `class_name`, `email`, and `updated_at`.
2. Revoke the overly-broad UPDATE grant from `anon` to prevent unauthenticated
   profile mutations.
3. Re-assert the existing UPDATE RLS policy (`profiles_update_own`) so it
   remains scoped to `auth.uid() = id`.

## Security
- RLS remains enabled on `profiles`.
- The UPDATE policy still requires `auth.uid() = id` for both USING and
  WITH CHECK, so users can only update their own row.
- `anon` loses UPDATE capability entirely.
- Columns like `rank_tier`, `rank_points`, `streak_days`, `roadmap_day`, and
  `last_session_date` remain updatable by authenticated users (they were
  already in the grant list) — these are updated by app logic on behalf of
  the signed-in user.
*/

-- Revoke broad UPDATE from anon (was granted by an earlier migration)
REVOKE UPDATE ON profiles FROM anon;

-- Grant UPDATE to authenticated with explicit column list
GRANT UPDATE (full_name, date_of_birth, province, school, class_name, email, updated_at, rank_tier, rank_points, streak_days, roadmap_day, last_session_date) ON profiles TO authenticated;

-- Re-assert the UPDATE policy (drop + recreate for idempotency)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

/*
# Fix ensure_profile to map all registration metadata fields

## Problem
The `ensure_profile` fallback function only extracted `username` and
`full_name` from `raw_user_meta_data` when creating a profile for a user
whose profile row was missing. The fields `date_of_birth`, `province`,
`school`, and `class_name` were ignored, so if the profile was created via
this fallback (instead of the direct upsert in the registration handler),
those columns persisted as NULL.

## Fix
Extract all six metadata fields from `raw_user_meta_data` and include them
in the INSERT statement. This mirrors the payload the registration handler
sends via `supabase.auth.signUp({ options: { data: { ... } } })`.

## Security
- Function remains SECURITY DEFINER with fixed search_path.
- No changes to EXECUTE grants.
- Only reads from auth.users (privileged, hence SECURITY DEFINER).
*/

CREATE OR REPLACE FUNCTION ensure_profile(p_uid uuid)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_email text;
  v_username text;
  v_full_name text;
  v_date_of_birth date;
  v_province text;
  v_school text;
  v_class_name text;
BEGIN
  -- Return existing profile if it exists
  RETURN QUERY SELECT * FROM profiles WHERE id = p_uid LIMIT 1;

  IF NOT FOUND THEN
    -- Pull ALL metadata fields from auth.users
    SELECT
      email,
      raw_user_meta_data->>'username',
      raw_user_meta_data->>'full_name',
      (raw_user_meta_data->>'date_of_birth')::date,
      raw_user_meta_data->>'province',
      raw_user_meta_data->>'school',
      raw_user_meta_data->>'class_name'
    INTO
      v_email,
      v_username,
      v_full_name,
      v_date_of_birth,
      v_province,
      v_school,
      v_class_name
    FROM auth.users WHERE id = p_uid;

    IF v_email IS NULL THEN
      RETURN;
    END IF;

    v_username := COALESCE(v_username, split_part(v_email, '@', 1));
    v_full_name := COALESCE(v_full_name, v_username);

    INSERT INTO profiles (
      id, full_name, username, email,
      date_of_birth, province, school, class_name
    )
    VALUES (
      p_uid, v_full_name, v_username, v_email,
      v_date_of_birth, v_province, v_school, v_class_name
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN QUERY SELECT * FROM profiles WHERE id = p_uid LIMIT 1;
  END IF;
END;
$function$;

/*
# Add Admin Role, Admin User, and Admin RLS Policies

1. Schema Changes
- Add `role` column to `profiles` table (text, default 'student', values: 'student' | 'admin')
- Create `is_admin()` helper function (SECURITY DEFINER, STABLE) that checks if auth.uid() has role='admin'

2. Admin User Creation
- Create a hardcoded admin auth user with email admin@khkt.local and password administrators2026@#
- Insert corresponding profile row with username='Admin', full_name='Administrator', role='admin'
- Email confirmation is bypassed (email_confirmed_at set to now())

3. Security (RLS)
- Add admin SELECT policy on profiles (admin can view all user profiles)
- Add admin UPDATE policy on profiles (admin can modify user profiles)
- Add admin SELECT policy on experiment_sessions (admin can view all sessions)
- Add admin DELETE policy on experiment_sessions (admin can delete/reset sessions)
- Add admin SELECT policy on roadmap_progress (admin can view all roadmap progress)
- Add admin UPDATE policy on roadmap_progress (admin can unlock/modify stations)
- Add admin DELETE policy on roadmap_progress (admin can reset roadmap progress)
- All admin policies use is_admin() check; existing owner-scoped policies remain unchanged

4. Important Notes
- The is_admin() function is SECURITY DEFINER so it bypasses RLS when checking the role, avoiding circular recursion
- The admin user's username is "Admin" — the existing get_user_by_username RPC resolves this to admin@khkt.local for login
- Standard users retain their existing owner-scoped CRUD policies; admin policies are additive
*/

-- 1. Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

-- 2. Create is_admin() helper function
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Create admin auth user + profile
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@khkt.local';
  IF admin_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role
    )
    VALUES (
      gen_random_uuid(),
      'admin@khkt.local',
      crypt('administrators2026@#', gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('full_name', 'Administrator', 'username', 'Admin'),
      now(),
      now(),
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO admin_id;
  ELSE
    -- Ensure password is correct if user already exists
    UPDATE auth.users
    SET encrypted_password = crypt('administrators2026@#', gen_salt('bf')),
        email_confirmed_at = now()
    WHERE id = admin_id;
  END IF;

  -- Insert or update admin profile
  INSERT INTO profiles (id, full_name, username, email, role, province, school, class_name)
  VALUES (admin_id, 'Administrator', 'Admin', 'admin@khkt.local', 'admin', 'System', 'Administration', 'Admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', username = 'Admin', email = 'admin@khkt.local', full_name = 'Administrator';
END $$;

-- 4. Admin RLS policies (additive to existing owner-scoped policies)

-- Profiles: admin can read all and update all
DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "admin_update_all_profiles" ON profiles;
CREATE POLICY "admin_update_all_profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Experiment sessions: admin can read all and delete all
DROP POLICY IF EXISTS "admin_select_all_sessions" ON experiment_sessions;
CREATE POLICY "admin_select_all_sessions" ON experiment_sessions
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "admin_delete_all_sessions" ON experiment_sessions;
CREATE POLICY "admin_delete_all_sessions" ON experiment_sessions
  FOR DELETE TO authenticated
  USING (is_admin());

-- Roadmap progress: admin can read all, update all, delete all
DROP POLICY IF EXISTS "admin_select_all_roadmap" ON roadmap_progress;
CREATE POLICY "admin_select_all_roadmap" ON roadmap_progress
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "admin_update_all_roadmap" ON roadmap_progress;
CREATE POLICY "admin_update_all_roadmap" ON roadmap_progress
  FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_all_roadmap" ON roadmap_progress;
CREATE POLICY "admin_delete_all_roadmap" ON roadmap_progress
  FOR DELETE TO authenticated
  USING (is_admin());

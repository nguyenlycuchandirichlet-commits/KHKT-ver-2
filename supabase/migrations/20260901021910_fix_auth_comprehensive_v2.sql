/*
# Sửa lỗi xác thực toàn diện

1. Thêm cột email vào profiles
2. DROP + recreate get_user_by_username (return TABLE thay đổi)
3. DROP + recreate ensure_profile (return SETOF profiles)
4. Cập nhật handle_new_user trigger
5. RLS grants
*/

-- 1. Thêm cột email vào profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text DEFAULT '';

-- Điền email cho các profile hiện có
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 2. DROP + recreate get_user_by_username
DROP FUNCTION IF EXISTS public.get_user_by_username(text);
CREATE FUNCTION public.get_user_by_username(p_username text)
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email
  FROM profiles p
  WHERE lower(p.username) = lower(trim(p_username))
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_by_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_by_username(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_username(text) TO authenticated;

-- 3. DROP + recreate ensure_profile — trả về SETOF profiles
DROP FUNCTION IF EXISTS public.ensure_profile(uuid);
CREATE FUNCTION public.ensure_profile(p_uid uuid)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_username text;
  v_full_name text;
BEGIN
  -- Kiểm tra profile đã tồn tại
  RETURN QUERY SELECT * FROM profiles WHERE id = p_uid LIMIT 1;

  IF NOT FOUND THEN
    SELECT email,
      raw_user_meta_data->>'username',
      raw_user_meta_data->>'full_name'
    INTO v_email, v_username, v_full_name
    FROM auth.users WHERE id = p_uid;

    IF v_email IS NULL THEN
      RETURN;
    END IF;

    v_username := COALESCE(v_username, split_part(v_email, '@', 1));
    v_full_name := COALESCE(v_full_name, v_username);

    INSERT INTO profiles (id, full_name, username, email)
    VALUES (p_uid, v_full_name, v_username, v_email)
    ON CONFLICT (id) DO NOTHING;

    RETURN QUERY SELECT * FROM profiles WHERE id = p_uid LIMIT 1;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_profile(uuid) TO authenticated;

-- 4. Cập nhật handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_username text;
  v_email text;
  v_full_name text;
BEGIN
  v_email := NEW.email;

  IF NEW.raw_user_meta_data ? 'username' THEN
    v_username := NEW.raw_user_meta_data->>'username';
  ELSE
    v_username := split_part(v_email, '@', 1);
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    v_username
  );

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, full_name, username, email)
    VALUES (NEW.id, v_full_name, v_username, v_email)
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.profiles
    SET email = v_email
    WHERE id = NEW.id AND (email IS NULL OR email = '');
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- 5. Mở rộng UPDATE grant cho cột email
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (
  full_name, date_of_birth, province, school, class_name, email,
  rank_tier, rank_points, streak_days, roadmap_day, last_session_date
) ON profiles TO authenticated;

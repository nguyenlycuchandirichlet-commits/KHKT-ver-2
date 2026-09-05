/*
# Sửa lỗi xác thực và đồng bộ dữ liệu

1. Trigger tự động tạo profile khi auth.users insert
   - Ngăn trạng thái mồ côi: auth user tồn tại nhưng không có profile
   - Lấy username từ raw_user_meta_data hoặc tạo từ email

2. Cấp quyền EXECUTE get_user_by_username cho anon
   - Login bằng username xảy ra khi chưa xác thực → anon cần gọi hàm này

3. Mở rộng UPDATE grant trên profiles cho các cột rank/roadmap
   - rank_tier, rank_points, streak_days, roadmap_day, last_session_date

4. Thêm hàm ensure_profile để tạo profile nếu thiếu (fallback)
*/

-- ===== 1. Trigger tự động tạo profile =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_username text;
  v_email text;
BEGIN
  v_email := NEW.email;

  -- Tạo username từ email (phần trước @) hoặc từ metadata
  IF NEW.raw_user_meta_data ? 'username' THEN
    v_username := NEW.raw_user_meta_data->>'username';
  ELSE
    v_username := split_part(v_email, '@', 1);
  END IF;

  -- Chỉ tạo nếu chưa tồn tại
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, full_name, username)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', v_username),
      v_username
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Xoá trigger cũ nếu có rồi tạo lại
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== 2. Cấp quyền get_user_by_username cho anon =====
-- Login bằng username xảy ra TRƯỚC khi xác thực → anon cần gọi được
GRANT EXECUTE ON FUNCTION get_user_by_username(text) TO anon;

-- ===== 3. Mở rộng UPDATE grant trên profiles =====
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (
  full_name, date_of_birth, province, school, class_name,
  rank_tier, rank_points, streak_days, roadmap_day, last_session_date
) ON profiles TO authenticated;

-- ===== 4. Hàm ensure_profile — tạo profile nếu thiếu =====
CREATE OR REPLACE FUNCTION public.ensure_profile(p_uid uuid)
RETURNS TABLE (id uuid, full_name text, username text, school text, class_name text, province text, rank_tier text, rank_points int, streak_days int, roadmap_day int, last_session_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_username text;
BEGIN
  -- Kiểm tra profile đã tồn tại
  RETURN QUERY
  SELECT p.id, p.full_name, p.username, p.school, p.class_name, p.province, p.rank_tier, p.rank_points, p.streak_days, p.roadmap_day, p.last_session_date
  FROM public.profiles p
  WHERE p.id = p_uid;

  IF NOT FOUND THEN
    -- Tạo profile từ auth.users
    SELECT email INTO v_email FROM auth.users WHERE id = p_uid;
    IF v_email IS NULL THEN
      RETURN;
    END IF;
    v_username := split_part(v_email, '@', 1);

    INSERT INTO public.profiles (id, full_name, username)
    VALUES (p_uid, v_username, v_username)
    ON CONFLICT (id) DO NOTHING;

    RETURN QUERY
    SELECT p.id, p.full_name, p.username, p.school, p.class_name, p.province, p.rank_tier, p.rank_points, p.streak_days, p.roadmap_day, p.last_session_date
    FROM public.profiles p
    WHERE p.id = p_uid;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION ensure_profile(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION ensure_profile(uuid) TO authenticated;

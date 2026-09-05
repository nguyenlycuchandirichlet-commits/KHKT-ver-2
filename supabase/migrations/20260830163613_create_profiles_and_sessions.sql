/*
# Tạo bảng hồ sơ học sinh và lịch sử làm bài

1. Bảng mới: `profiles`
   - Lưu thông tin học sinh THPT cho đề tài nghiên cứu "Semantic Drift".
   - `id` (uuid, khoá chính, khớp với auth.users.id)
   - `full_name` (text, họ và tên học sinh)
   - `date_of_birth` (date, ngày tháng năm sinh)
   - `province` (text, tỉnh/thành phố)
   - `school` (text, trường THPT)
   - `class_name` (text, lớp)
   - `username` (text, tên tài khoản, duy nhất — không phân biệt hoa thường)
   - `created_at`, `updated_at` (timestamptz)

2. Bảng mới: `experiment_sessions`
   - Lưu các phiên làm bài của học sinh.
   - `id` (uuid, khoá chính)
   - `user_id` (uuid, FK -> auth.users, mặc định auth.uid())
   - `title` (text, tiêu đề phiên làm bài)
   - `status` (text: 'in_progress' | 'completed', mặc định 'in_progress')
   - `score` (int, điểm số, nullable)
   - `notes` (text, ghi chú, nullable)
   - `started_at`, `completed_at` (timestamptz)
   - `created_at` (timestamptz)

3. Hàm mới: `get_user_by_username`
   - Hàm SECURITY DEFINER tra cứu người dùng theo username (không phân biệt hoa thường).
   - Trả về id và email để dùng cho luồng đăng nhập bằng tên tài khoản.
   - Chỉ EXECUTE cho authenticated.

4. Bảo mật (RLS)
   - Bật RLS trên cả hai bảng.
   - profiles: người dùng chỉ đọc/sửa dòng của chính mình (auth.uid() = id).
   - experiment_sessions: CRUD theo chủ sở hữu (auth.uid() = user_id).
   - Thu hẹp quyền UPDATE trên profiles chỉ các cột học sinh được phép sửa
     (full_name, date_of_birth, province, school, class_name) — không cho sửa username/id.

5. Ghi chú
   - Username có unique index trên lower(username) để tránh trùng lặp khác hoa thường.
   - user_id mặc định auth.uid() để insert từ client không cần truyền user_id.
*/

-- ===== profiles =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  date_of_birth date,
  province text DEFAULT '',
  school text DEFAULT '',
  class_name text DEFAULT '',
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Thu hẹp UPDATE chỉ cho các cột học sinh được phép sửa
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name, date_of_birth, province, school, class_name) ON profiles TO authenticated;

-- Unique username không phân biệt hoa thường
DROP INDEX IF EXISTS profiles_username_lower_key;
CREATE UNIQUE INDEX profiles_username_lower_key ON profiles (lower(username));

-- ===== experiment_sessions =====
CREATE TABLE IF NOT EXISTS experiment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Phiên làm bài',
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  score int,
  notes text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE experiment_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_select_own" ON experiment_sessions;
CREATE POLICY "sessions_select_own"
  ON experiment_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_insert_own" ON experiment_sessions;
CREATE POLICY "sessions_insert_own"
  ON experiment_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_update_own" ON experiment_sessions;
CREATE POLICY "sessions_update_own"
  ON experiment_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_delete_own" ON experiment_sessions;
CREATE POLICY "sessions_delete_own"
  ON experiment_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ===== Hàm tra cứu người dùng theo username =====
CREATE OR REPLACE FUNCTION get_user_by_username(p_username text)
RETURNS TABLE (id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  WHERE lower(p.username) = lower(p_username);
END;
$$;

REVOKE EXECUTE ON FUNCTION get_user_by_username(text) FROM anon;
GRANT EXECUTE ON FUNCTION get_user_by_username(text) TO authenticated;

-- Trigger tự động tạo profile khi đăng ký (qua raw_app_meta_data không cần thiết,
-- client sẽ insert profile sau khi signUp thành công).

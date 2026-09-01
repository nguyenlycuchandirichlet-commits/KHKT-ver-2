/*
# Hàm tạo tài khoản học sinh mới (Thêm tài khoản)

1. Hàm mới: `create_student_account`
   - Hàm SECURITY DEFINER dùng cho luồng "Thêm tài khoản" trong Cài đặt.
   - Cho phép người dùng đã đăng nhập tạo tài khoản học sinh phụ mà không cần đăng xuất.
   - Tham số: họ tên, tên tài khoản, mật khẩu, lớp, trường, tỉnh/thành, ngày sinh.
   - Tạo auth user mới bằng `auth.users` insert (user_type = 'auxiliary'),
     sau đó insert vào bảng profiles.
   - Trả về id của tài khoản mới hoặc lỗi dưới dạng text.
   - Kiểm tra trùng username qua unique index.
   - REVOKE EXECUTE từ anon; GRANT cho authenticated.

2. Ghi chú bảo mật
   - Hàm chạy với quyền owner (bypass RLS) để insert vào auth.users và profiles.
   - Chỉ authenticated role mới được gọi — anon không thể tạo tài khoản qua hàm này.
   - Email ảo dạng <username>@khkt.local đảm bảo duy nhất.
   - Mật khẩu được băm bằng cùng cơ chế auth.users (encrypted_password).
*/

CREATE OR REPLACE FUNCTION create_student_account(
  p_full_name text,
  p_username text,
  p_password text,
  p_class_name text DEFAULT '',
  p_school text DEFAULT '',
  p_province text DEFAULT '',
  p_date_of_birth date DEFAULT NULL
)
RETURNS TABLE (success boolean, user_id uuid, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_email text;
  v_encrypted text;
  v_norm_username text;
BEGIN
  -- Kiểm tra đầu vào
  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Họ và tên phải có ít nhất 2 ký tự'::text;
    RETURN;
  END IF;
  IF p_username IS NULL OR length(trim(p_username)) < 3 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Tên tài khoản phải có ít nhất 3 ký tự'::text;
    RETURN;
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Mật khẩu phải có ít nhất 6 ký tự'::text;
    RETURN;
  END IF;

  v_norm_username := lower(trim(p_username));
  v_email := v_norm_username || '@khkt.local';

  -- Kiểm tra trùng username
  IF EXISTS (SELECT 1 FROM profiles WHERE lower(username) = v_norm_username) THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Tên tài khoản đã tồn tại'::text;
    RETURN;
  END IF;

  -- Kiểm tra trùng email trong auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(v_email)) THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Tên tài khoản đã tồn tại'::text;
    RETURN;
  END IF;

  -- Băm mật khẩu bằng crypt (pgcrypto) — tương thích với Supabase auth
  v_encrypted := crypt(p_password, gen_salt('bf'));

  -- Tạo auth user
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    aud, role, email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token
  )
  VALUES (
    v_id,
    '00000000-0000-0000-0000-000000000000',
    v_email,
    v_encrypted,
    'authenticated',
    'authenticated',
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    '',
    ''
  );

  -- Tạo identities entry
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_id,
    jsonb_build_object('sub', v_id::text, 'email', v_email),
    'email',
    now(),
    now(),
    now()
  );

  -- Tạo profile
  INSERT INTO profiles (id, full_name, username, class_name, school, province, date_of_birth)
  VALUES (v_id, trim(p_full_name), trim(p_username), trim(p_class_name), trim(p_school), p_province, p_date_of_birth);

  RETURN QUERY SELECT true, v_id, ''::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_student_account(text, text, text, text, text, text, date) FROM anon;
REVOKE EXECUTE ON FUNCTION create_student_account(text, text, text, text, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_student_account(text, text, text, text, text, text, date) TO authenticated;

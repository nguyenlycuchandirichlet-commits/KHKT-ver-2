/*
# Sửa lỗi bảo mật từ database linter

1. rank_view: SECURITY DEFINER → SECURITY INVOKER (RLS trên profiles được áp dụng)
2. handle_new_user: REVOKE EXECUTE từ mọi role — chỉ trigger mới gọi
3. ensure_profile: REVOKE từ anon + PUBLIC, giữ authenticated
4. get_user_by_username: REVOKE từ PUBLIC, giữ anon + authenticated (cần cho login)
5. create_student_account: REVOKE từ PUBLIC, giữ authenticated
*/

-- 1. rank_view: tái tạo với SECURITY INVOKER
DROP VIEW IF EXISTS public.rank_view;
CREATE VIEW public.rank_view
  WITH (security_invoker = true) AS
SELECT username, rank_tier, rank_points, streak_days, school, class_name
FROM profiles p
WHERE rank_points > 0
ORDER BY rank_points DESC;

-- Cấp lại SELECT cho roles cần đọc
GRANT SELECT ON public.rank_view TO authenticated;
REVOKE SELECT ON public.rank_view FROM anon;

-- 2. handle_new_user: chỉ trigger gọi, không cho gọi qua API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- 3. ensure_profile: chỉ authenticated
REVOKE EXECUTE ON FUNCTION public.ensure_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_profile(uuid) FROM PUBLIC;

-- 4. get_user_by_username: chỉ anon + authenticated (cần cho login), không PUBLIC
REVOKE EXECUTE ON FUNCTION public.get_user_by_username(text) FROM PUBLIC;

-- 5. create_student_account: chỉ authenticated, không PUBLIC
REVOKE EXECUTE ON FUNCTION public.create_student_account(text, text, text, text, text, text, date) FROM PUBLIC;

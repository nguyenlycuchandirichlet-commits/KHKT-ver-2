/*
# Sửa quyền EXECUTE cho get_user_by_username

Hàm get_user_by_username cần được gọi bởi anon vì luồng đăng nhập
bằng tên tài khoản xảy ra TRƯỚC khi xác thực. REVOKE từ public rồi
GRANT lại cho anon + authenticated.
*/

REVOKE EXECUTE ON FUNCTION get_user_by_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_by_username(text) TO anon, authenticated;

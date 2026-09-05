/*
# Mở rộng profiles cho rank + roadmap, thêm bảng leaderboard

1. Bảng profiles: thêm cột
   - rank_tier (text): hạng leaderboard (Bronze/Silver/Gold/Diamond/Master)
   - rank_points (int): điểm xếp hạng
   - streak_days (int): chuỗi ngày liên tục làm bài
   - roadmap_day (int): ngày hiện tại trong lộ trình 7 ngày (1-7)
   - last_session_date (date): ngày làm bài gần nhất

2. Bảng mới: rank_view — view tổng hợp xếp hạng
   - Hiển thị top học sinh theo điểm rank, ẩn tên thật để bảo mật
   - Chỉ hiển thị username, rank_tier, rank_points, school

3. Bảo mật: profiles RLS kế thừa, rank_view chỉ SELECT cho authenticated
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rank_tier text DEFAULT 'Bronze',
  ADD COLUMN IF NOT EXISTS rank_points int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_days int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS roadmap_day int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_session_date date;

-- Cho phép authenticated cập nhật các cột rank/roadmap của chính mình
GRANT UPDATE (rank_tier, rank_points, streak_days, roadmap_day, last_session_date)
  ON profiles TO authenticated;

-- View xếp hạng ẩn danh
CREATE OR REPLACE VIEW rank_view AS
SELECT
  p.username,
  p.rank_tier,
  p.rank_points,
  p.streak_days,
  p.school,
  p.class_name
FROM profiles p
WHERE p.rank_points > 0
ORDER BY p.rank_points DESC;

ALTER VIEW rank_view OWNER TO postgres;
GRANT SELECT ON rank_view TO authenticated;

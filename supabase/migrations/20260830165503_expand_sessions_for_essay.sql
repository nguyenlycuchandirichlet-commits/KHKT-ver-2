/*
# Mở rộng bảng experiment_sessions cho bài luận tư duy phản biện

1. Bảng đã có: `experiment_sessions`
2. Các cột mới (ADD COLUMN — không ảnh hưởng dữ liệu cũ):
   - `prompt_id` (int): mã đề bài luận đã chọn
   - `prompt_title` (text): tiêu đề đề bài
   - `essay_text` (text): toàn văn bài luận học sinh viết
   - `word_count` (int): số từ thực tế
   - `duration_seconds` (int): thời gian làm bài thực tế (giây)
   - `wpm` (numeric): tốc độ viết trung bình (từ/phút)
   - `backspace_count` (int): số lần gõ backspace
   - `tab_violations` (int): số lần chuyển tab / mất focus
   - `idle_seconds` (int): tổng thời gian ngưng gõ (giây)
   - `scores` (jsonb): điểm đa chiều {depth, fluency, independence, vocabularyCoherence, speed}
   - `vocab_stats` (jsonb): thống kê từ vựng {common, critical, unique, total}

3. Bảo mật
   - Không thay đổi RLS hiện tại (owner-scoped CRUD).
   - Các cột mới nằm trong cùng bảng nên kế thừa chính sách RLS đã có.
   - Thu hẹp quyền UPDATE cho authenticated: thêm các cột mới vào danh sách cho phép cập nhật.
*/

ALTER TABLE experiment_sessions
  ADD COLUMN IF NOT EXISTS prompt_id int,
  ADD COLUMN IF NOT EXISTS prompt_title text,
  ADD COLUMN IF NOT EXISTS essay_text text,
  ADD COLUMN IF NOT EXISTS word_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_seconds int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wpm numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS backspace_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tab_violations int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS idle_seconds int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scores jsonb,
  ADD COLUMN IF NOT EXISTS vocab_stats jsonb;

-- Mở rộng quyền UPDATE cho authenticated trên các cột mới
GRANT UPDATE (
  title, status, score, notes, completed_at,
  prompt_id, prompt_title, essay_text, word_count,
  duration_seconds, wpm, backspace_count, tab_violations,
  idle_seconds, scores, vocab_stats
) ON experiment_sessions TO authenticated;

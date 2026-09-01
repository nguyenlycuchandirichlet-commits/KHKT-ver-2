/*
# Bảng roadmap_progress: lưu tiến trình 7 ngày leo núi nhận thức
*/
CREATE TABLE IF NOT EXISTS roadmap_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day int NOT NULL DEFAULT 1, -- ngày 1-7
  status text NOT NULL DEFAULT 'locked', -- locked / available / in_progress / completed
  completed_at timestamptz,
  debate_rounds int DEFAULT 0, -- số lượt tranh luận đã thực hiện
  debate_evaluated boolean DEFAULT false, -- đã nhận đánh giá AI
  challenge_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day)
);

ALTER TABLE roadmap_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_roadmap" ON roadmap_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_roadmap" ON roadmap_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_roadmap" ON roadmap_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_roadmap" ON roadmap_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Cấp quyền cho authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON roadmap_progress TO authenticated;

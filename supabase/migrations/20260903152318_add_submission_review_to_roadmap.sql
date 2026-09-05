/*
# Add submission review columns to roadmap_progress

1. Purpose
   Allow students to review their completed roadmap submissions (text, score, feedback) at any time.
   Previously, once a node was completed, the student's writing/debate text was lost — only status and debate_rounds were stored.

2. Changes to `roadmap_progress`
   - `submission_text` (text, nullable): The student's full written response or debate arguments.
   - `submission_score` (integer, nullable): Overall score (0-100) computed at submission time.
   - `submission_feedback` (jsonb, nullable): The full feedback matrix (depth, vocab, advice) as JSON.
   - `submission_type` (text, nullable): The type of submission ('writing', 'debate', 'challenge', 'speed', 'summit').

3. Security
   - No new tables. RLS already enabled on roadmap_progress with owner-scoped policies.
   - Existing policies cover the new columns (UPDATE/INSERT already scoped to auth.uid() = user_id).

4. Notes
   - All new columns are nullable so existing rows are unaffected.
   - The upsert in the frontend will now include the submission data when completing a node.
*/

ALTER TABLE roadmap_progress
  ADD COLUMN IF NOT EXISTS submission_text text,
  ADD COLUMN IF NOT EXISTS submission_score integer,
  ADD COLUMN IF NOT EXISTS submission_feedback jsonb,
  ADD COLUMN IF NOT EXISTS submission_type text;

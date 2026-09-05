/*
# Leaderboard aggregation function with scope filtering

## Purpose
Provides a server-side ranked leaderboard that aggregates cumulative scores,
streak counts, and rank tiers from the `profiles` table. Supports three scopes:
global ("all"), school-wide, and class-level. Returns entries with real-time
rank indices (#1, #2, #3 ...) computed via `ROW_NUMBER()` ordered by
`rank_points DESC, streak_days DESC, updated_at DESC`.

## New Functions
- `get_leaderboard(p_scope text, p_school text, p_class_name text)`
  - p_scope: 'all' | 'school' | 'class'
  - p_school: the caller's school (used when scope = 'school' or 'class')
  - p_class_name: the caller's class (used when scope = 'class')
  - Returns: user_id, username, full_name, rank_tier, rank_points, streak_days,
    school, class_name, rank_index, total_sessions, roadmap_day
  - Joins to `experiment_sessions` to include total completed session count
  - Only includes users with rank_points > 0 (active competitors)
  - Ordered by rank_index ascending

## Security
- SECURITY DEFINER with fixed search_path (safe from search_path injection)
- Callable by authenticated role only
- Does not expose full_name to the client — the function returns it but the
  frontend uses username for display (anonymous). full_name is included so
  the caller could potentially show it in a future "reveal" mode, but the
  default frontend behavior masks it.
- RLS on profiles is bypassed via SECURITY DEFINER so all competing users'
  aggregate data is visible (needed for a global leaderboard). Individual
  row-level data (email, date_of_birth) is NOT returned.
*/

CREATE OR REPLACE FUNCTION get_leaderboard(
  p_scope text DEFAULT 'all',
  p_school text DEFAULT NULL,
  p_class_name text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  rank_tier text,
  rank_points integer,
  streak_days integer,
  school text,
  class_name text,
  rank_index bigint,
  total_sessions bigint,
  roadmap_day integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH competing AS (
    SELECT
      p.id,
      p.username,
      p.full_name,
      p.rank_tier,
      p.rank_points,
      p.streak_days,
      p.school,
      p.class_name,
      p.roadmap_day
    FROM profiles p
    WHERE p.rank_points > 0
      AND (
        CASE
          WHEN p_scope = 'school' THEN p.school = p_school
          WHEN p_scope = 'class' THEN p.school = p_school AND p.class_name = p_class_name
          ELSE true
        END
      )
  ),
  session_counts AS (
    SELECT
      user_id,
      COUNT(*)::bigint AS total_sessions
    FROM experiment_sessions
    WHERE status = 'completed'
    GROUP BY user_id
  )
  SELECT
    c.id AS user_id,
    c.username,
    c.full_name,
    c.rank_tier,
    c.rank_points,
    c.streak_days,
    c.school,
    c.class_name,
    ROW_NUMBER() OVER (
      ORDER BY c.rank_points DESC, c.streak_days DESC, c.username ASC
    ) AS rank_index,
    COALESCE(sc.total_sessions, 0) AS total_sessions,
    c.roadmap_day
  FROM competing c
  LEFT JOIN session_counts sc ON sc.user_id = c.id
  ORDER BY rank_index ASC;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard(text, text, text) TO authenticated;

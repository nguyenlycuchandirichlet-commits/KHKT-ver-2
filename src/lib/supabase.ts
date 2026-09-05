import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Thiếu biến môi trường Supabase. Vui lòng kiểm tra file .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    storageKey: 'khkt-auth-token',
  },
});

export type Profile = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  province: string;
  school: string;
  class_name: string;
  username: string;
  email?: string;
  created_at: string;
  updated_at: string;
  rank_tier?: string;
  rank_points?: number;
  streak_days?: number;
  roadmap_day?: number;
  last_session_date?: string | null;
};

export type ExperimentSession = {
  id: string;
  user_id: string;
  title: string;
  status: 'in_progress' | 'completed';
  score: number | null;
  notes: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  // Essay fields
  prompt_id?: number | null;
  prompt_title?: string | null;
  essay_text?: string | null;
  word_count?: number | null;
  duration_seconds?: number | null;
  wpm?: number | null;
  backspace_count?: number | null;
  tab_violations?: number | null;
  idle_seconds?: number | null;
  scores?: Record<string, number> | null;
  vocab_stats?: Record<string, number> | null;
};

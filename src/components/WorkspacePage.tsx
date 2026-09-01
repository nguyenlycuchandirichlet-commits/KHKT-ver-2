import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type ExperimentSession } from '@/lib/supabase';
import type { Prompt } from '@/lib/prompts';
import type { EssayResult } from '@/lib/scoring';
import { getRankPoints, getRankTier } from '@/lib/scoring';
import BriefingScreen from '@/components/essay/BriefingScreen';
import EssayWorkspace from '@/components/essay/EssayWorkspace';
import AnalyticsDashboard from '@/components/essay/AnalyticsDashboard';
import { Button } from '@/components/ui';
import {
  Play,
  FlaskConical,
  Plus,
  Mountain,
  Trophy,
} from 'lucide-react';
import type { Page } from '@/lib/pages';

type Stage = 'overview' | 'briefing' | 'essay' | 'analytics';

export default function WorkspacePage({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const { user, profile } = useAuth();
  const [stage, setStage] = useState<Stage>('overview');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [essayResult, setEssayResult] = useState<EssayResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ExperimentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('experiment_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setSessions((data as ExperimentSession[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleStartEssay = async (prompt: Prompt) => {
    if (!user) return;
    setSelectedPrompt(prompt);
    // Create session record
    const { data, error } = await supabase
      .from('experiment_sessions')
      .insert({
        user_id: user.id,
        title: prompt.title,
        status: 'in_progress',
        prompt_id: prompt.id,
        prompt_title: prompt.title,
      })
      .select()
      .single();
    if (error) {
      console.error('create session failed', error);
    } else {
      setSessionId(data.id);
    }
    setStage('essay');
  };

  const handleEssayComplete = async (result: EssayResult) => {
    setEssayResult(result);
    setSaving(true);
    if (user && sessionId) {
      const { error } = await supabase
        .from('experiment_sessions')
        .update({
          status: 'completed',
          essay_text: result.text,
          word_count: result.telemetry.wordCount,
          duration_seconds: result.telemetry.durationSeconds,
          wpm: result.telemetry.wpm,
          backspace_count: result.telemetry.backspaceCount,
          tab_violations: result.telemetry.tabViolations,
          idle_seconds: result.telemetry.idleSeconds,
          score: result.overall,
          scores: result.scores,
          vocab_stats: {
            common: result.vocab.common,
            critical: result.vocab.critical,
            unique: result.vocab.unique,
            total: result.vocab.total,
            clicheHits: result.vocab.clicheHits,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
      if (error) console.error('update session failed', error);

      // Update rank points + streak
      const rankPoints = result.rankPoints || getRankPoints(result.overall, result.scores, result.telemetry);
      const today = new Date().toISOString().split('T')[0];
      const { data: profData } = await supabase
        .from('profiles')
        .select('rank_points, streak_days, last_session_date, roadmap_day')
        .eq('id', user.id)
        .single();
      if (profData) {
        const currentPoints = (profData as any).rank_points || 0;
        const lastDate = (profData as any).last_session_date;
        const currentStreak = (profData as any).streak_days || 0;
        let newStreak = currentStreak;
        if (lastDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          newStreak = lastDate === yesterday ? currentStreak + 1 : 1;
        }
        const newPoints = currentPoints + rankPoints;
        const newTier = getRankTier(newPoints).tier;
        await supabase
          .from('profiles')
          .update({
            rank_points: newPoints,
            rank_tier: newTier,
            streak_days: newStreak,
            last_session_date: today,
          })
          .eq('id', user.id);
      }

      await loadSessions();
    }
    setSaving(false);
    setStage('analytics');
  };

  const handleDone = () => {
    setStage('overview');
    setEssayResult(null);
    setSelectedPrompt(null);
    setSessionId(null);
  };

  // Render stages
  if (stage === 'briefing') {
    return <BriefingScreen onStart={handleStartEssay} />;
  }

  if (stage === 'essay' && selectedPrompt) {
    return (
      <EssayWorkspace
        selectedPrompt={selectedPrompt}
        onComplete={handleEssayComplete}
      />
    );
  }

  if (stage === 'analytics' && essayResult && selectedPrompt) {
    return (
      <AnalyticsDashboard
        result={essayResult}
        promptTitle={selectedPrompt.title}
        onDone={handleDone}
      />
    );
  }

  // Overview stage
  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
            Không gian làm bài
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Chào {profile?.full_name || 'học sinh'}, hãy bắt đầu phiên làm bài
            cho đề tài nghiên cứu của bạn.
          </p>
        </div>

        {/* Quick actions */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in-up">
          <div className="group rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur-md transition hover:shadow-lg dark:bg-slate-800/60">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
              <Play className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-slate-100">
              Bắt đầu phiên nghiên cứu
            </h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Vào phòng thí nghiệm viết kín — chọn đề và làm bài nghị luận trong
              15 phút.
            </p>
            <Button
              onClick={() => setStage('briefing')}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              Chuẩn bị làm bài
            </Button>
          </div>

          <div className="group rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur-md transition hover:shadow-lg dark:bg-slate-800/60">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Mountain className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-slate-100">
              Lộ trình leo núi nhận thức
            </h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              7 ngày thử thách cá nhân hoá + tranh luận đa tác nhân AI.
            </p>
            <Button
              variant="secondary"
              onClick={() => onNavigate('roadmap')}
              className="w-full"
            >
              <Mountain className="h-4 w-4" />
              Vào lộ trình
            </Button>
          </div>

          <div className="group rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur-md transition hover:shadow-lg dark:bg-slate-800/60">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-slate-100">
              Sân đấu nhận thức
            </h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Bảng xếp hạng hạng nhóm: Đồng, Bạc, Vàng, Kim Cương, Master.
            </p>
            <Button
              variant="secondary"
              onClick={() => onNavigate('arena')}
              className="w-full"
            >
              <Trophy className="h-4 w-4" />
              Xem xếp hạng
            </Button>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="animate-fade-in-up">
          <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100">
            Phiên làm bài gần đây
          </h2>
          {loading ? (
            <div className="rounded-2xl bg-white/80 p-8 text-center text-sm text-slate-400 dark:bg-slate-800/60">
              Đang tải...
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl bg-white/80 p-8 text-center dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chưa có phiên làm bài nào. Hãy bắt đầu phiên đầu tiên!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:bg-slate-800/60"
                >
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {s.prompt_title || s.title}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      {s.status === 'completed' ? 'Hoàn thành' : 'Đang làm'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <span>
                      {new Date(s.started_at).toLocaleDateString('vi-VN')}
                    </span>
                    {s.word_count != null && s.word_count > 0 && (
                      <span>{s.word_count} từ</span>
                    )}
                    {s.score != null && (
                      <span className="font-semibold text-brand-600 dark:text-brand-400">
                        {s.score} điểm
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
          Đang lưu dữ liệu làm bài...
        </div>
      )}
    </div>
  );
}

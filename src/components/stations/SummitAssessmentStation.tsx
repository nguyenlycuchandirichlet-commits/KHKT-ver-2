import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type ExperimentSession } from '@/lib/supabase';
import { Button } from '@/components/ui';
import RadarChart from '@/components/charts/RadarChart';
import FireworksOverlay from '@/components/effects/FireworksOverlay';
import {
  Mountain,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Award,
  Brain,
  Zap,
  Shield,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import type { Scores } from '@/lib/scoring';

type ComparisonMetric = {
  key: keyof Scores;
  label: string;
  icon: React.ReactNode;
  day1Score: number;
  day7Score: number;
};

export default function SummitAssessmentStation({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { user } = useAuth();
  const [day1Session, setDay1Session] = useState<ExperimentSession | null>(null);
  const [day7Session, setDay7Session] = useState<ExperimentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [eruption, setEruption] = useState(false);

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('experiment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: true })
        .limit(10);
      const sessions = (data as ExperimentSession[]) || [];
      // Day 1 = earliest completed session
      setDay1Session(sessions[0] || null);
      // Day 7 = most recent completed session (or second if there are 2+)
      setDay7Session(sessions[sessions.length - 1] || null);
      setLoading(false);
    };
    loadSessions();
  }, [user]);

  const day1Scores = day1Session?.scores as Scores | undefined;
  const day7Scores = day7Session?.scores as Scores | undefined;

  const hasComparison = day1Scores && day7Scores && day1Session?.id !== day7Session?.id;

  const metrics: ComparisonMetric[] = hasComparison
    ? [
        { key: 'depth', label: 'Chiều sâu', icon: <Brain className="h-4 w-4" />, day1Score: day1Scores.depth, day7Score: day7Scores.depth },
        { key: 'fluency', label: 'Trôi chảy', icon: <TrendingUp className="h-4 w-4" />, day1Score: day1Scores.fluency, day7Score: day7Scores.fluency },
        { key: 'independence', label: 'Độc lập', icon: <Shield className="h-4 w-4" />, day1Score: day1Scores.independence, day7Score: day7Scores.independence },
        { key: 'vocabularyCoherence', label: 'Từ vựng', icon: <BookOpen className="h-4 w-4" />, day1Score: day1Scores.vocabularyCoherence, day7Score: day7Scores.vocabularyCoherence },
        { key: 'speed', label: 'Tốc độ', icon: <Zap className="h-4 w-4" />, day1Score: day1Scores.speed, day7Score: day7Scores.speed },
      ]
    : [];

  const totalDay1 = hasComparison
    ? Math.round((day1Scores.depth + day1Scores.fluency + day1Scores.independence + day1Scores.vocabularyCoherence + day1Scores.speed) / 5)
    : 0;
  const totalDay7 = hasComparison
    ? Math.round((day7Scores.depth + day7Scores.fluency + day7Scores.independence + day7Scores.vocabularyCoherence + day7Scores.speed) / 5)
    : 0;
  const improvement = totalDay7 - totalDay1;

  const triggerEruption = () => {
    setEruption(true);
    setTimeout(() => {
      onComplete();
    }, 4500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Sparkles className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Đang tải dữ liệu so sánh...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FireworksOverlay trigger={eruption} onDone={() => {}} />

      <div className="rounded-xl bg-gradient-to-br from-red-50 to-orange-50 p-5 dark:from-red-900/20 dark:to-orange-900/20">
        <div className="mb-2 flex items-center gap-2">
          <Mountain className="h-5 w-5 text-red-500" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400">
            Đỉnh núi lửa · Kiểm tra tổng hợp tuần
          </p>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          So sánh tiến bộ nhận thức từ Ngày 1 (Trại chân núi) với hiện tại.
          Chứng minh rằng tư duy phản biện đã thực sự bùng nổ.
        </p>
      </div>

      {!hasComparison ? (
        <div className="rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-800/50">
          <Mountain className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cần ít nhất 2 phiên làm bài hoàn thành để so sánh tiến bộ.
            <br />
            Hãy làm bài ở Không gian làm bài trước, sau đó quay lại đây.
          </p>
          <Button onClick={onComplete} className="mt-4" variant="secondary">
            <CheckCircle2 className="h-4 w-4" />
            Bỏ qua — Hoàn thành đỉnh núi
          </Button>
        </div>
      ) : (
        <>
          {/* Total score comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border-2 border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-semibold text-slate-400">Ngày 1 · Chân núi</p>
              <p className="mt-1 text-4xl font-bold text-slate-600 dark:text-slate-300">{totalDay1}</p>
              <p className="text-xs text-slate-400">/100</p>
            </div>
            <div className="rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 p-5 text-center dark:border-orange-700 dark:from-orange-900/20 dark:to-red-900/20">
              <p className="text-xs font-semibold text-orange-500">Hiện tại · Đỉnh núi</p>
              <p className="mt-1 text-4xl font-bold text-orange-600 dark:text-orange-400">{totalDay7}</p>
              <p className="text-xs text-orange-400">/100</p>
            </div>
          </div>

          {/* Improvement badge */}
          <div className={`flex items-center justify-center gap-2 rounded-xl p-3 ${
            improvement > 0
              ? 'bg-emerald-50 dark:bg-emerald-900/20'
              : improvement < 0
                ? 'bg-red-50 dark:bg-red-900/20'
                : 'bg-slate-50 dark:bg-slate-800/50'
          }`}>
            {improvement > 0 ? (
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            ) : improvement < 0 ? (
              <TrendingDown className="h-5 w-5 text-red-500" />
            ) : (
              <Minus className="h-5 w-5 text-slate-400" />
            )}
            <span className={`text-lg font-bold ${
              improvement > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : improvement < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-500'
            }`}>
              {improvement > 0 ? '+' : ''}{improvement} điểm tiến bộ
            </span>
          </div>

          {/* Radar chart comparison */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4 dark:bg-slate-800">
              <p className="mb-2 text-center text-xs font-semibold text-slate-400">Radar Ngày 1</p>
              <div className="flex justify-center">
                <RadarChart scores={day1Scores} />
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 dark:bg-slate-800">
              <p className="mb-2 text-center text-xs font-semibold text-orange-400">Radar Hiện tại</p>
              <div className="flex justify-center">
                <RadarChart scores={day7Scores} />
              </div>
            </div>
          </div>

          {/* Per-metric breakdown */}
          <div className="space-y-2">
            {metrics.map((m) => {
              const diff = m.day7Score - m.day1Score;
              return (
                <div key={m.key} className="flex items-center gap-3 rounded-xl bg-white p-3 dark:bg-slate-800">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    {m.icon}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-300">{m.label}</span>
                  <span className="text-sm text-slate-400">{m.day1Score}</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{m.day7Score}</span>
                  <span className={`w-12 text-right text-xs font-bold ${
                    diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-slate-400'
                  }`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Eruption trigger */}
          <div className="rounded-xl bg-gradient-to-br from-red-900 to-orange-900 p-6 text-center text-white">
            <Award className="mx-auto mb-3 h-12 w-12 text-orange-400" />
            <p className="mb-2 text-lg font-bold">
              {improvement > 0
                ? 'Núi lửa phun trào! Nhận thức đã bùng nổ!'
                : 'Đã chinh phục đỉnh núi lửa!'}
            </p>
            <p className="mb-4 text-sm text-orange-200">
              {improvement > 0
                ? `Bạn đã tiến bộ ${improvement} điểm từ Ngày 1. Tư duy phản biện đã thực sự biến đổi.`
                : 'Tiếp tục luyện tập để nâng cao điểm số lần sau.'}
            </p>
            <Button onClick={triggerEruption} className="w-full">
              <Mountain className="h-5 w-5" />
              Kích hoạt phun trào núi lửa
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

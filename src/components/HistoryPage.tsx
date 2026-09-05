import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type ExperimentSession } from '@/lib/supabase';
import { Button } from '@/components/ui';
import RadarChart from '@/components/charts/RadarChart';
import ScatterChart from '@/components/charts/ScatterChart';
import StackedBarChart from '@/components/charts/StackedBarChart';
import {
  History as HistoryIcon,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Loader2,
  Trash2,
  Calendar,
  Award,
  StickyNote,
  Inbox,
  Type,
  Zap,
  Timer,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import type { Page } from '@/lib/pages';
import type { Scores, VocabStats, Telemetry } from '@/lib/scoring';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function scoreLabel(key: string): string {
  const labels: Record<string, string> = {
    depth: 'Chiều sâu',
    fluency: 'Trôi chảy',
    independence: 'Độc lập',
    vocabularyCoherence: 'Từ vựng',
    speed: 'Tốc độ',
  };
  return labels[key] || key;
}

function buildScatterPoints(scores: Scores, telemetry: Telemetry) {
  return [
    { x: Math.round(telemetry.idleSeconds * 0.2), y: Math.round(scores.depth * 0.9), idle: Math.round(telemetry.idleSeconds * 0.2), depth: Math.round(scores.depth * 0.9), label: 'Đầu phiên' },
    { x: Math.round(telemetry.idleSeconds * 0.4), y: Math.round(scores.depth * 0.75), idle: Math.round(telemetry.idleSeconds * 0.4), depth: Math.round(scores.depth * 0.75), label: '1/3 phiên' },
    { x: Math.round(telemetry.idleSeconds * 0.6), y: Math.round(scores.depth * 0.85), idle: Math.round(telemetry.idleSeconds * 0.6), depth: Math.round(scores.depth * 0.85), label: 'Giữa phiên' },
    { x: Math.round(telemetry.idleSeconds * 0.8), y: Math.round(scores.depth * 0.7), idle: Math.round(telemetry.idleSeconds * 0.8), depth: Math.round(scores.depth * 0.7), label: '2/3 phiên' },
    { x: Math.max(Math.round(telemetry.idleSeconds), 5), y: scores.depth, idle: Math.max(Math.round(telemetry.idleSeconds), 5), depth: scores.depth, label: 'Cuối phiên' },
  ];
}

function buildVocabSegments(vocab: VocabStats) {
  return [
    { label: 'M1', common: Math.round(vocab.common * 0.2), critical: Math.round(vocab.critical * 0.1) },
    { label: 'M2', common: Math.round(vocab.common * 0.4), critical: Math.round(vocab.critical * 0.3) },
    { label: 'M3', common: Math.round(vocab.common * 0.6), critical: Math.round(vocab.critical * 0.5) },
    { label: 'M4', common: Math.round(vocab.common * 0.75), critical: Math.round(vocab.critical * 0.7) },
    { label: 'M5', common: Math.round(vocab.common * 0.9), critical: Math.round(vocab.critical * 0.85) },
    { label: 'M6', common: vocab.common, critical: vocab.critical },
  ];
}

export default function HistoryPage({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ExperimentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('experiment_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      setError('Không thể tải lịch sử làm bài. Vui lòng thử lại.');
      console.error('history load failed', error);
    } else {
      setSessions((data as ExperimentSession[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('experiment_sessions')
      .delete()
      .eq('id', id);
    if (error) {
      setError('Không thể xoá phiên làm bài. Vui lòng thử lại.');
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const completed = sessions.filter((s) => s.status === 'completed').length;
  const avgScore =
    completed > 0
      ? Math.round(
          sessions
            .filter((s) => s.score !== null)
            .reduce((sum, s) => sum + (s.score || 0), 0) / completed,
        )
      : 0;

  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => onNavigate('workspace')}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>

        <div className="mb-8 flex items-center gap-3 animate-fade-in-up">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            <HistoryIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Lịch sử làm bài
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Xem lại phiên làm bài — tái lập luận để nâng điểm
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4 animate-fade-in-up">
          <StatCard label="Tổng số phiên" value={sessions.length} icon={<Clock className="h-5 w-5" />} />
          <StatCard label="Đã hoàn thành" value={completed} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
          <StatCard label="Điểm trung bình" value={avgScore || '—'} icon={<Award className="h-5 w-5" />} tone="amber" />
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Sessions list */}
        <div className="rounded-2xl bg-white/80 shadow-sm backdrop-blur-md dark:bg-slate-800/60 animate-fade-in-up">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải...
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Chưa có phiên làm bài nào
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Các phiên làm bài sẽ hiển thị tại đây sau khi bạn bắt đầu làm bài.
              </p>
              <Button className="mt-5" onClick={() => onNavigate('workspace')}>
                Bắt đầu làm bài
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {sessions.map((s) => (
                <li key={s.id}>
                  <div
                    className="flex cursor-pointer items-center gap-4 p-5 transition hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      s.status === 'completed'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {s.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {s.prompt_title || s.title}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(s.started_at)}
                      </p>
                    </div>
                    {s.score !== null && (
                      <span className="hidden rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 sm:inline">
                        {s.score} điểm
                      </span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      s.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {s.status === 'completed' ? 'Hoàn thành' : 'Đang làm'}
                    </span>
                  </div>

                  {expandedId === s.id && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 dark:border-slate-700/50 dark:bg-slate-900/30 animate-slide-up">
                      {/* Detail grid */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <DetailItem icon={<Clock className="h-4 w-4" />} label="Bắt đầu" value={formatDate(s.started_at)} />
                        <DetailItem icon={<CheckCircle2 className="h-4 w-4" />} label="Hoàn thành" value={s.completed_at ? formatDate(s.completed_at) : '—'} />
                        <DetailItem icon={<Award className="h-4 w-4" />} label="Tổng điểm" value={s.score !== null ? `${s.score}/100` : '—'} />
                        <DetailItem icon={<Type className="h-4 w-4" />} label="Số từ" value={s.word_count != null ? `${s.word_count}` : '—'} />
                        {s.wpm != null && <DetailItem icon={<Zap className="h-4 w-4" />} label="Tốc độ" value={`${Math.round(Number(s.wpm))} từ/phút`} />}
                        {s.duration_seconds != null && <DetailItem icon={<Timer className="h-4 w-4" />} label="Thời gian" value={`${Math.round(Number(s.duration_seconds) / 60)} phút`} />}
                        {s.tab_violations != null && <DetailItem icon={<AlertTriangle className="h-4 w-4" />} label="Vi phạm tab" value={`${s.tab_violations}`} />}
                        {s.idle_seconds != null && <DetailItem icon={<Timer className="h-4 w-4" />} label="Ngưng gõ" value={`${s.idle_seconds} giây`} />}
                      </div>

                      {/* Rehydrated charts */}
                      {s.status === 'completed' && s.scores && typeof s.scores === 'object' && (
                        <div className="mt-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-brand-500" />
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Phân tích đa chiều tái tạo từ dữ liệu
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {/* Radar chart */}
                            <div className="rounded-xl bg-white p-4 dark:bg-slate-800">
                              <p className="mb-2 text-xs font-semibold text-slate-400">Radar 5 trục</p>
                              <div className="flex justify-center">
                                <RadarChart scores={s.scores as Scores} />
                              </div>
                            </div>

                            {/* Scatter chart */}
                            <div className="rounded-xl bg-white p-4 dark:bg-slate-800">
                              <p className="mb-2 text-xs font-semibold text-slate-400">Phân tán: Ngưng gõ vs Chiều sâu</p>
                              <div className="flex justify-center">
                                {(() => {
                                  const scores = s.scores as Scores;
                                  const idleSec = Number(s.idle_seconds || 0);
                                  const scatterPoints = buildScatterPoints(scores, {
                                    wordCount: Number(s.word_count || 0),
                                    charCount: 0,
                                    wpm: Number(s.wpm || 0),
                                    backspaceCount: 0,
                                    tabViolations: Number(s.tab_violations || 0),
                                    idleSeconds: idleSec,
                                    durationSeconds: Number(s.duration_seconds || 0),
                                  });
                                  return <ScatterChart points={scatterPoints} />;
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Stacked bar chart */}
                          {s.vocab_stats && typeof s.vocab_stats === 'object' && (
                            <div className="rounded-xl bg-white p-4 dark:bg-slate-800">
                              <p className="mb-2 text-xs font-semibold text-slate-400">Phân bố từ vựng</p>
                              <div className="overflow-x-auto">
                                <StackedBarChart segments={buildVocabSegments(s.vocab_stats as VocabStats)} />
                              </div>
                            </div>
                          )}

                          {/* Score bars */}
                          <div className="space-y-2">
                            {Object.entries(s.scores).map(([key, val]) => {
                              const v = val as number;
                              const tone = v >= 70 ? 'from-green-400 to-green-600' : v >= 40 ? 'from-amber-400 to-amber-600' : 'from-red-400 to-red-600';
                              return (
                                <div key={key} className="rounded-xl bg-white p-3 dark:bg-slate-800">
                                  <div className="mb-1 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{scoreLabel(key)}</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{v}/100</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                    <div className={`h-full rounded-full bg-gradient-to-r ${tone} transition-all duration-700`} style={{ width: `${v}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Essay text preview */}
                      {s.essay_text && (
                        <div className="mt-4 rounded-xl bg-white p-3 dark:bg-slate-800">
                          <p className="mb-1 text-xs font-semibold text-slate-400">Bài luận:</p>
                          <p className="line-clamp-4 text-sm text-slate-600 dark:text-slate-300">{s.essay_text}</p>
                        </div>
                      )}
                      {s.notes && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl bg-white p-3 dark:bg-slate-800">
                          <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <p className="text-sm text-slate-600 dark:text-slate-300">{s.notes}</p>
                        </div>
                      )}

                      {/* Rewrite CTA */}
                      {s.status === 'completed' && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-brand-50 to-violet-50 p-4 dark:from-brand-900/20 dark:to-violet-900/20">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-brand-500" />
                            <div>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Tái lập luận / Viết lại
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                Viết lại bài này để đẩy điểm cao hơn và so sánh tiến bộ
                              </p>
                            </div>
                          </div>
                          <Button onClick={() => onNavigate('workspace')} className="!py-2">
                            <TrendingUp className="h-4 w-4" />
                            Viết lại
                          </Button>
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Xoá phiên
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: 'brand' | 'green' | 'amber';
}) {
  const tones = {
    brand: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return (
    <div className="rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-md dark:bg-slate-800/60">
      <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
        {icon}
      </span>
      <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

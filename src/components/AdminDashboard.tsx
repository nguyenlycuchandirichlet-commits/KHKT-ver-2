import { useState, useEffect, useCallback } from 'react';
import { supabase, type Profile, type ExperimentSession } from '@/lib/supabase';
import { Button } from '@/components/ui';
import RadarChart from '@/components/charts/RadarChart';
import {
  Shield,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  Type,
  Zap,
  Timer,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Unlock,
  Lock,
  Mountain,
  TrendingUp,
  Inbox,
  Loader2,
  Activity,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import type { Page } from '@/lib/pages';
import type { Scores } from '@/lib/scoring';

type RoadmapProgress = {
  id: string;
  user_id: string;
  day: number;
  status: string;
  completed_at: string | null;
  debate_rounds: number | null;
  debate_evaluated: boolean | null;
  submission_text: string | null;
  submission_score: number | null;
  submission_feedback: Record<string, unknown> | null;
  submission_type: string | null;
};

type UserWithStats = Profile & {
  session_count: number;
  completed_count: number;
  avg_score: number;
  roadmap_days_completed: number;
};

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

export default function AdminDashboard({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const [profiles, setProfiles] = useState<UserWithStats[]>([]);
  const [sessions, setSessions] = useState<Record<string, ExperimentSession[]>>({});
  const [roadmapData, setRoadmapData] = useState<Record<string, RoadmapProgress[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileErr) throw profileErr;

      const { data: sessionData, error: sessionErr } = await supabase
        .from('experiment_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (sessionErr) throw sessionErr;

      const { data: roadmapRaw, error: roadmapErr } = await supabase
        .from('roadmap_progress')
        .select('*')
        .order('day', { ascending: true });

      if (roadmapErr) throw roadmapErr;

      const sessionMap: Record<string, ExperimentSession[]> = {};
      (sessionData as ExperimentSession[] || []).forEach((s) => {
        if (!sessionMap[s.user_id]) sessionMap[s.user_id] = [];
        sessionMap[s.user_id].push(s);
      });

      const roadmapMap: Record<string, RoadmapProgress[]> = {};
      (roadmapRaw as RoadmapProgress[] || []).forEach((r) => {
        if (!roadmapMap[r.user_id]) roadmapMap[r.user_id] = [];
        roadmapMap[r.user_id].push(r);
      });

      const usersWithStats: UserWithStats[] = (profileData as Profile[] || []).map((p) => {
        const userSessions = sessionMap[p.id] || [];
        const completed = userSessions.filter((s) => s.status === 'completed');
        const avgScore = completed.length > 0
          ? Math.round(completed.reduce((sum, s) => sum + (s.score || 0), 0) / completed.length)
          : 0;
        const roadmapDays = (roadmapMap[p.id] || []).filter((r) => r.status === 'completed').length;
        return {
          ...p,
          session_count: userSessions.length,
          completed_count: completed.length,
          avg_score: avgScore,
          roadmap_days_completed: roadmapDays,
        };
      });

      setProfiles(usersWithStats);
      setSessions(sessionMap);
      setRoadmapData(roadmapMap);
    } catch (cause) {
      const err = cause as { message?: string };
      setError(err.message || 'Không thể tải dữ liệu quản trị.');
      console.error('admin load failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = profiles.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.username?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.school?.toLowerCase().includes(q)
    );
  });

  const handleResetProgress = async (userId: string) => {
    if (!confirm('Xác nhận đặt lại toàn bộ lộ trình của người dùng này?')) return;
    setActionLoading(`reset-${userId}`);
    try {
      const { error } = await supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
      await supabase
        .from('profiles')
        .update({ roadmap_day: 1, rank_points: 0, streak_days: 0 })
        .eq('id', userId);
      await loadData();
    } catch (cause) {
      const err = cause as { message?: string };
      setError(err.message || 'Không thể đặt lại lộ trình.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlockDay = async (userId: string, day: number) => {
    setActionLoading(`unlock-${userId}-${day}`);
    try {
      const { error } = await supabase
        .from('roadmap_progress')
        .upsert({
          user_id: userId,
          day,
          status: 'available',
          completed_at: null,
        }, { onConflict: 'user_id,day' });
      if (error) throw error;
      await loadData();
    } catch (cause) {
      const err = cause as { message?: string };
      setError(err.message || 'Không thể mở khoá trạm.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSession = async (sessionId: string, userId: string) => {
    if (!confirm('Xoá phiên làm bài này?')) return;
    setActionLoading(`del-${sessionId}`);
    try {
      const { error } = await supabase
        .from('experiment_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
      const updated = (sessions[userId] || []).filter((s) => s.id !== sessionId);
      setSessions((prev) => ({ ...prev, [userId]: updated }));
    } catch (cause) {
      const err = cause as { message?: string };
      setError(err.message || 'Không thể xoá phiên.');
    } finally {
      setActionLoading(null);
    }
  };

  const totalUsers = profiles.length;
  const totalSessions = Object.values(sessions).reduce((sum, arr) => sum + arr.length, 0);
  const totalCompleted = Object.values(sessions).reduce(
    (sum, arr) => sum + arr.filter((s) => s.status === 'completed').length,
    0,
  );

  return (
    <div className="min-h-[100dvh] px-4 pt-24 pb-24 sm:px-6 sm:pb-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3 animate-fade-in-up">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Bảng điều khiển quản trị
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Quản lý người dùng, tiến trình và dữ liệu làm bài
            </p>
          </div>
        </div>

        {/* Overview stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 animate-fade-in-up">
          <StatCard label="Tổng người dùng" value={totalUsers} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Tổng phiên làm bài" value={totalSessions} icon={<Activity className="h-5 w-5" />} tone="green" />
          <StatCard label="Đã hoàn thành" value={totalCompleted} icon={<CheckCircle2 className="h-5 w-5" />} tone="amber" />
          <StatCard
            label="Điểm TB toàn hệ"
            value={
              totalCompleted > 0
                ? Math.round(
                    Object.values(sessions)
                      .flat()
                      .filter((s) => s.status === 'completed' && s.score !== null)
                      .reduce((sum, s) => sum + (s.score || 0), 0) / totalCompleted,
                  )
                : '—'
            }
            icon={<Award className="h-5 w-5" />}
            tone="brand"
          />
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-md dark:bg-slate-800/60">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, tài khoản, email, trường..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
          />
        </div>

        {/* User list */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải dữ liệu...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Không tìm thấy người dùng nào
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const isExpanded = expandedUser === p.id;
              const userSessions = sessions[p.id] || [];
              const userRoadmap = roadmapData[p.id] || [];
              return (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-2xl bg-white/80 shadow-sm backdrop-blur-md dark:bg-slate-800/60 animate-fade-in-up"
                >
                  {/* User row */}
                  <div
                    className="flex cursor-pointer items-center gap-3 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    onClick={() => setExpandedUser(isExpanded ? null : p.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                    )}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                      {p.full_name?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {p.full_name}
                        </p>
                        {p.role === 'admin' && (
                          <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                        @{p.username} · {p.email}
                      </p>
                    </div>
                    <div className="hidden items-center gap-4 text-xs text-slate-400 sm:flex">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {p.session_count} phiên
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {p.completed_count} hoàn thành
                      </span>
                      <span className="flex items-center gap-1">
                        <Mountain className="h-3.5 w-3.5" />
                        {p.roadmap_days_completed}/7
                      </span>
                      {p.avg_score > 0 && (
                        <span className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                          <Award className="h-3.5 w-3.5" />
                          {p.avg_score}đ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-900/30 animate-slide-up">
                      {/* User info grid */}
                      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <InfoItem label="Trường" value={p.school || '—'} />
                        <InfoItem label="Lớp" value={p.class_name || '—'} />
                        <InfoItem label="Tỉnh/Thành" value={p.province || '—'} />
                        <InfoItem label="Ngày sinh" value={p.date_of_birth || '—'} />
                        <InfoItem label="Hạng" value={p.rank_tier || 'Bronze'} />
                        <InfoItem label="Điểm hạng" value={`${p.rank_points || 0}`} />
                        <InfoItem label="Streak" value={`${p.streak_days || 0} ngày`} />
                        <InfoItem label="Ngày lộ trình" value={`${p.roadmap_day || 1}/7`} />
                      </div>

                      {/* Admin actions */}
                      <div className="mb-5 flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="!py-2 !text-xs"
                          onClick={() => handleResetProgress(p.id)}
                          loading={actionLoading === `reset-${p.id}`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Đặt lại lộ trình
                        </Button>
                      </div>

                      {/* Roadmap progress */}
                      <div className="mb-5">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                          <Mountain className="h-4 w-4 text-brand-500" />
                          Tiến trình lộ trình (7 ngày)
                        </h3>
                        {userRoadmap.length === 0 ? (
                          <p className="text-xs text-slate-400">Chưa có dữ liệu lộ trình.</p>
                        ) : (
                          <div className="grid grid-cols-7 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                              const rp = userRoadmap.find((r) => r.day === day);
                              const isCompleted = rp?.status === 'completed';
                              const isLocked = !rp || rp?.status === 'locked';
                              return (
                                <div
                                  key={day}
                                  className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center ${
                                    isCompleted
                                      ? 'bg-green-100 dark:bg-green-900/30'
                                      : isLocked
                                        ? 'bg-slate-100 dark:bg-slate-700/40'
                                        : 'bg-amber-100 dark:bg-amber-900/30'
                                  }`}
                                >
                                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                    isCompleted
                                      ? 'bg-green-500 text-white'
                                      : isLocked
                                        ? 'bg-slate-300 text-slate-500 dark:bg-slate-600'
                                        : 'bg-amber-500 text-white'
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : isLocked ? (
                                      <Lock className="h-3.5 w-3.5" />
                                    ) : (
                                      <Unlock className="h-3.5 w-3.5" />
                                    )}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                    Ngày {day}
                                  </span>
                                  {rp?.submission_score != null && (
                                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                                      {rp.submission_score}đ
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Unlock buttons */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <button
                              key={day}
                              onClick={() => handleUnlockDay(p.id, day)}
                              disabled={actionLoading === `unlock-${p.id}-${day}`}
                              className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50 disabled:opacity-50 dark:bg-slate-800 dark:text-brand-400 dark:hover:bg-slate-700"
                            >
                              <Unlock className="mr-1 inline h-3 w-3" />
                              Mở Ngày {day}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Submission history */}
                      <div>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                          <Clock className="h-4 w-4 text-brand-500" />
                          Lịch sử làm bài ({userSessions.length})
                        </h3>
                        {userSessions.length === 0 ? (
                          <p className="text-xs text-slate-400">Chưa có phiên làm bài nào.</p>
                        ) : (
                          <div className="space-y-2">
                            {userSessions.map((s) => (
                              <SessionDetail
                                key={s.id}
                                session={s}
                                onDelete={() => handleDeleteSession(s.id, p.id)}
                                loading={actionLoading === `del-${s.id}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Refresh */}
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={loadData} loading={loading}>
            <RefreshCw className="h-4 w-4" />
            Tải lại dữ liệu
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionDetail({
  session: s,
  onDelete,
  loading,
}: {
  session: ExperimentSession;
  onDelete: () => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800">
      <div
        className="flex cursor-pointer items-center gap-3 p-3 transition hover:bg-slate-50 dark:hover:bg-slate-700/30"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        )}
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          s.status === 'completed'
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {s.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
            {s.prompt_title || s.title}
          </p>
          <p className="flex items-center gap-1 text-[10px] text-slate-400">
            <Calendar className="h-3 w-3" />
            {formatDate(s.started_at)}
          </p>
        </div>
        {s.score !== null && (
          <span className="shrink-0 rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            {s.score}đ
          </span>
        )}
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          s.status === 'completed'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {s.status === 'completed' ? 'Hoàn thành' : 'Đang làm'}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-3 dark:border-slate-700/50">
          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DetailItem icon={<Clock className="h-3.5 w-3.5" />} label="Bắt đầu" value={formatDate(s.started_at)} />
            <DetailItem icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Hoàn thành" value={s.completed_at ? formatDate(s.completed_at) : '—'} />
            <DetailItem icon={<Award className="h-3.5 w-3.5" />} label="Tổng điểm" value={s.score !== null ? `${s.score}/100` : '—'} />
            <DetailItem icon={<Type className="h-3.5 w-3.5" />} label="Số từ" value={s.word_count != null ? `${s.word_count}` : '—'} />
            {s.wpm != null && <DetailItem icon={<Zap className="h-3.5 w-3.5" />} label="Tốc độ" value={`${Math.round(Number(s.wpm))} từ/phút`} />}
            {s.duration_seconds != null && <DetailItem icon={<Timer className="h-3.5 w-3.5" />} label="Thời gian" value={`${Math.round(Number(s.duration_seconds) / 60)} phút`} />}
            {s.tab_violations != null && <DetailItem icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Vi phạm tab" value={`${s.tab_violations}`} />}
            {s.idle_seconds != null && <DetailItem icon={<Timer className="h-3.5 w-3.5" />} label="Ngưng gõ" value={`${s.idle_seconds}s`} />}
          </div>

          {/* Radar chart */}
          {s.status === 'completed' && s.scores && typeof s.scores === 'object' && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-700/30">
              <p className="mb-1 text-[10px] font-semibold text-slate-400">Phân tích đa chiều (Radar)</p>
              <div className="flex justify-center">
                <RadarChart scores={s.scores as Scores} />
              </div>
              {/* Score bars */}
              <div className="mt-2 space-y-1.5">
                {Object.entries(s.scores).map(([key, val]) => {
                  const v = val as number;
                  const tone = v >= 70 ? 'from-green-400 to-green-600' : v >= 40 ? 'from-amber-400 to-amber-600' : 'from-red-400 to-red-600';
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-[10px] font-medium text-slate-500 dark:text-slate-400">{scoreLabel(key)}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
                        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${v}%` }} />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[10px] font-bold text-slate-600 dark:text-slate-300">{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Essay text */}
          {s.essay_text && (
            <div className="mt-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-700/30">
              <p className="mb-0.5 text-[10px] font-semibold text-slate-400">Bài luận:</p>
              <p className="line-clamp-3 text-xs text-slate-600 dark:text-slate-300">{s.essay_text}</p>
            </div>
          )}

          {/* Delete */}
          <div className="mt-2 flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-3 w-3" />
              Xoá phiên
            </button>
          </div>
        </div>
      )}
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
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:bg-slate-800/60">
      <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>
        {icon}
      </span>
      <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
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
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

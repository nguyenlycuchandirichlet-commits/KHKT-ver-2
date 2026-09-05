import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import VolcanoParticleFX, { LavaBurstEffect } from '@/components/effects/VolcanoParticleFX';
import TemplateDismantlingStation from '@/components/stations/TemplateDismantlingStation';
import SpeedRebuttalStation from '@/components/stations/SpeedRebuttalStation';
import SummitAssessmentStation from '@/components/stations/SummitAssessmentStation';
import { generateRoadmapFeedback, generateDebateEval, getRandomSpamToast } from '@/lib/roadmapFeedback';
import type { FeedbackContext, RoadmapFeedback } from '@/lib/roadmapFeedback';
import {
  Mountain,
  Flag,
  Lock,
  CheckCircle2,
  Clock,
  Swords,
  Brain,
  Zap,
  ChevronRight,
  Send,
  Bot,
  User,
  Award,
  AlertCircle,
  Flame,
  MountainSnow,
  Puzzle,
  Timer,
  TrendingUp,
  Eye,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import type { Page } from '@/lib/pages';

type DayStatus = 'locked' | 'available' | 'in_progress' | 'completed';

type SavedSubmission = {
  text: string;
  score: number;
  feedback: RoadmapFeedback;
  type: string;
};

type DayProgress = {
  status: DayStatus;
  completedAt: string | null;
  debateRounds: number;
  debateEvaluated: boolean;
  submission: SavedSubmission | null;
};

type RoadmapDay = {
  day: number;
  title: string;
  subtitle: string;
  type: 'writing' | 'debate' | 'checkpoint' | 'challenge' | 'speed' | 'summit';
  desc: string;
  icon: React.ReactNode;
  altitude: string;
  intensity: 'low' | 'medium' | 'high';
};

const ROADMAP_DAYS: RoadmapDay[] = [
  {
    day: 1,
    title: 'Trại Chân Núi',
    subtitle: 'Khởi hành',
    type: 'writing',
    desc: 'Viết một đoạn nghị luận ngắn (100 từ) về trải nghiệm cá nhân với AI. Không dùng AI.',
    icon: <Flag className="h-5 w-5" />,
    altitude: '0m',
    intensity: 'low',
  },
  {
    day: 2,
    title: 'Dung Nham Nóng Chảy',
    subtitle: 'Tháo mẫu AI',
    type: 'challenge',
    desc: 'Phát hiện và thay thế cụm từ mẫu AI bằng giọng văn cá nhân. So sánh trước/sau.',
    icon: <Puzzle className="h-5 w-5" />,
    altitude: '200m',
    intensity: 'medium',
  },
  {
    day: 3,
    title: 'Đấu Trường Rực Lửa',
    subtitle: 'Tranh luận đa tác nhân',
    type: 'debate',
    desc: 'Tranh luận với hai phe AI (Pro-AI vs Anti-AI). Phải thực hiện ít nhất 2 lượt phản biện.',
    icon: <Swords className="h-5 w-5" />,
    altitude: '500m',
    intensity: 'medium',
  },
  {
    day: 4,
    title: 'Vực Thẳm Tốc Độ',
    subtitle: 'Tăng tốc phản biện',
    type: 'speed',
    desc: 'Viết phản biện trong 5 phút — không sửa, không xoá. Duy trì dòng suy nghĩ liên tục.',
    icon: <Timer className="h-5 w-5" />,
    altitude: '800m',
    intensity: 'high',
  },
  {
    day: 5,
    title: 'Đấu Trường Rực Lửa II',
    subtitle: 'Tranh luận nâng cao',
    type: 'debate',
    desc: 'Tranh luận đa tác nhân với chủ đề khó hơn. Bẻ gãy luận điểm đối lập.',
    icon: <Swords className="h-5 w-5" />,
    altitude: '1100m',
    intensity: 'high',
  },
  {
    day: 6,
    title: 'Sườn Núi Lửa',
    subtitle: 'Tổng hợp nghị luận',
    type: 'writing',
    desc: 'Viết bài nghị luận đầy đủ (200 từ) kết hợp tất cả kỹ năng: từ vựng phản biện, lập luận độc lập.',
    icon: <Brain className="h-5 w-5" />,
    altitude: '1400m',
    intensity: 'high',
  },
  {
    day: 7,
    title: 'Đỉnh Núi Lửa',
    subtitle: 'Kiểm tra tuần · Phun trào',
    type: 'summit',
    desc: 'So sánh tiến bộ với Ngày 1. Chứng minh sự biến đổi tư duy. Kích hoạt phun trào núi lửa.',
    icon: <MountainSnow className="h-5 w-5" />,
    altitude: '1800m',
    intensity: 'high',
  },
];

const PRO_AI_ARGUMENTS = [
  'AI giúp học sinh tiếp cận thông tin nhanh hơn, tại sao phải từ chối một công cụ tăng hiệu suất?',
  'AI không thay thế tư duy — nó chỉ là công cụ. Người dùng vẫn phải kiểm chứng và chọn lọc.',
  'Nếu không dùng AI, học sinh sẽ tụt hậu so với những người biết tận dụng nó.',
];

const ANTI_AI_ARGUMENTS = [
  'Khi học sinh dùng AI để viết, họ mất khả năng tự diễn đạt — đó là sự trôi dạt nhận thức.',
  'AI tạo ra ảo giác về khả năng: học sinh tưởng mình giỏi nhưng thực ra chỉ giỏi đặt câu hỏi.',
  'Phụ thuộc AI làm teo nhỏ vốn từ vựng phản biện — học sinh chỉ biết dùng từ phổ thông.',
];

const ADVANCED_DEBATE_TOPICS = [
  'AI nên bị cấm trong thi cử vì nó tạo ra sự bất công giữa những người có và không có công cụ.',
  'Tương lai của giáo dục là loại bỏ hoàn toàn bài tập viết vì AI đã làm được thay con người.',
];

type DebateMessage = {
  role: 'pro' | 'anti' | 'student' | 'eval';
  text: string;
};

type DebateEval = {
  logic: number;
  vocab: number;
  depth: number;
  total: number;
  strengths: string;
  weaknesses: string;
  suggestion: string;
};

export default function RoadmapPage({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const { user, profile } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);
  const [progress, setProgress] = useState<Record<number, DayProgress>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<RoadmapDay | null>(null);
  const [reviewDay, setReviewDay] = useState<RoadmapDay | null>(null);
  const [lavaBurst, setLavaBurst] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  const loadProgress = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('roadmap_progress')
      .select('*')
      .eq('user_id', user.id);
    const map: Record<number, DayProgress> = {};
    (data || []).forEach((r: any) => {
      map[r.day] = {
        status: r.status,
        completedAt: r.completed_at,
        debateRounds: r.debate_rounds || 0,
        debateEvaluated: r.debate_evaluated || false,
        submission: r.submission_text ? {
          text: r.submission_text,
          score: r.submission_score || 0,
          feedback: r.submission_feedback as RoadmapFeedback || null,
          type: r.submission_type || 'writing',
        } : null,
      };
    });
    setProgress(map);

    const day = profile?.roadmap_day || 1;
    setCurrentDay(day);

    if (!map[1]) {
      map[1] = { status: 'available', completedAt: null, debateRounds: 0, debateEvaluated: false, submission: null };
    }
    setProgress(map);
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const canAccessDay = (day: number): boolean => {
    if (day === 1) return true;
    const prev = progress[day - 1];
    if (!prev || prev.status !== 'completed') return false;
    if (prev.completedAt) {
      const elapsed = Date.now() - new Date(prev.completedAt).getTime();
      if (elapsed < 24 * 60 * 60 * 1000) return false;
    }
    return true;
  };

  const getTimeUntilUnlock = (day: number): string | null => {
    if (canAccessDay(day)) return null;
    const prev = progress[day - 1];
    if (!prev || prev.status !== 'completed') return 'Hoàn thành chặng trước trước';
    if (prev.completedAt) {
      const elapsed = Date.now() - new Date(prev.completedAt).getTime();
      const remaining = 24 * 60 * 60 * 1000 - elapsed;
      if (remaining > 0) {
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        return `Mở sau ${hours}h ${mins}p`;
      }
    }
    return null;
  };

  const triggerLavaBurst = () => {
    setLavaBurst(true);
    setScreenShake(true);
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const notes = [261.63, 329.63, 392.0, 523.25];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'sawtooth';
        const start = now + i * 0.08;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch { /* audio unavailable */ }
    setTimeout(() => setLavaBurst(false), 1500);
    setTimeout(() => setScreenShake(false), 500);
  };

  const completeDay = async (
    day: number,
    debateRounds = 0,
    debateEvaluated = false,
    submission: SavedSubmission | null = null,
  ) => {
    if (!user) return;
    triggerLavaBurst();
    const now = new Date().toISOString();
    const existing = progress[day];
    await supabase
      .from('roadmap_progress')
      .upsert({
        user_id: user.id,
        day,
        status: 'completed',
        completed_at: now,
        debate_rounds: debateRounds || existing?.debateRounds || 0,
        debate_evaluated: debateEvaluated || existing?.debateEvaluated || false,
        submission_text: submission?.text || null,
        submission_score: submission?.score || null,
        submission_feedback: submission?.feedback || null,
        submission_type: submission?.type || null,
      });
    const nextDay = Math.min(day + 1, 7);
    await supabase
      .from('profiles')
      .update({ roadmap_day: nextDay })
      .eq('id', user.id);
    await loadProgress();
    setTimeout(() => setSelectedDay(null), 1800);
  };

  const completedCount = Object.values(progress).filter(p => p.status === 'completed').length;
  const progressPct = Math.round((completedCount / 7) * 100);

  return (
    <div className={`min-h-screen px-4 pt-24 pb-16 sm:px-6 ${screenShake ? 'animate-screen-shake' : ''}`}>
      <LavaBurstEffect trigger={lavaBurst} />
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
              <MountainSnow className="h-5 w-5" />
              <div className="absolute inset-0 rounded-xl bg-orange-500 opacity-20 blur-md animate-lava-pulse" />
            </div>
            <span className="rounded-full bg-gradient-to-r from-orange-50 to-red-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:from-orange-900/30 dark:to-red-900/30 dark:text-orange-400">
              Hành trình núi lửa nhận thức · 7 ngày
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
            Núi Lửa Nhận Thức
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Chào {profile?.full_name || 'học sinh'}, mỗi chặng là một độ cao mới trên ngọn núi lửa.
            Hoàn thành chặng để phun trào dung nham và mở đường lên đỉnh.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-md dark:bg-slate-800/60 animate-fade-in-up">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <Mountain className="h-4 w-4 text-orange-500" />
              Độ cao đã chinh phục
            </span>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{progressPct}%</span>
          </div>
          <div className="relative h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
            {/* Glowing tip */}
            <div
              className="absolute top-0 h-4 w-3 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)] transition-all duration-700"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{completedCount}/7</p>
              <p className="text-xs text-slate-400">Chặng hoàn thành</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{profile?.streak_days || 0}</p>
              <p className="text-xs text-slate-400">Ngày liên tiếp</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{profile?.rank_points || 0}</p>
              <p className="text-xs text-slate-400">Điểm xếp hạng</p>
            </div>
          </div>
        </div>

        {/* Volcano trail */}
        {loading ? (
          <div className="rounded-2xl bg-white/80 p-8 text-center text-sm text-slate-400 dark:bg-slate-800/60">
            Đang tải hành trình núi lửa...
          </div>
        ) : (
          <div className="relative animate-fade-in-up">
            {/* Volcanic path SVG background */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="lavaPath" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="rgb(249 115 22 / 0.3)" />
                  <stop offset="100%" stopColor="rgb(239 68 68 / 0.15)" />
                </linearGradient>
              </defs>
              <path d="M 10 92 Q 25 78 30 62 Q 40 46 50 35 Q 65 24 75 14 L 90 4" stroke="url(#lavaPath)" strokeWidth="0.8" fill="none" strokeDasharray="3 2" />
            </svg>

            <div className="relative space-y-3">
              {ROADMAP_DAYS.map((d, idx) => {
                const p = progress[d.day];
                const status: DayStatus = p?.status || (d.day === 1 ? 'available' : 'locked');
                const accessible = canAccessDay(d.day);
                const timeLock = getTimeUntilUnlock(d.day);
                const isDebate = d.type === 'debate';
                const isCompleted = status === 'completed';
                const isAvailable = accessible && !isCompleted;
                const isLocked = !accessible;

                return (
                  <div
                    key={d.day}
                    className={`relative overflow-hidden flex items-center gap-4 rounded-2xl p-4 transition-all ${
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-50 to-green-50/50 dark:from-emerald-900/20 dark:to-green-900/10'
                        : isAvailable
                          ? 'bg-gradient-to-r from-orange-50 to-red-50/50 shadow-md dark:from-orange-900/20 dark:to-red-900/10'
                          : 'bg-slate-50/60 dark:bg-slate-800/30'
                    } backdrop-blur-md`}
                  >
                    {/* Particle FX for active/completed stations */}
                    {(isAvailable || isCompleted) && (
                      <div className="absolute inset-0 opacity-40">
                        <VolcanoParticleFX intensity={d.intensity} />
                      </div>
                    )}

                    {/* Station marker */}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                          isCompleted
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg'
                            : isAvailable
                              ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg animate-lava-pulse'
                              : 'bg-slate-200 text-slate-400 dark:bg-slate-700'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-7 w-7" />
                        ) : isLocked ? (
                          <Lock className="h-6 w-6" />
                        ) : (
                          d.icon
                        )}
                      </div>
                      {/* Chained effect for locked stations */}
                      {isLocked && (
                        <div className="absolute -top-1 -right-1 text-lg animate-chain-rattle">
                          🔒
                        </div>
                      )}
                      {/* Altitude label */}
                      <p className="mt-1 text-center text-[10px] font-medium text-slate-400">{d.altitude}</p>
                    </div>

                    {/* Content */}
                    <div className="relative min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {d.title}
                        </p>
                        <span className="text-xs text-slate-400">{d.subtitle}</span>
                        {isDebate && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            Tranh luận AI
                          </span>
                        )}
                        {d.type === 'speed' && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            Tăng tốc
                          </span>
                        )}
                        {d.type === 'challenge' && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            Tháo mẫu
                          </span>
                        )}
                        {d.type === 'summit' && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            Phun trào
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {d.desc}
                      </p>
                      {timeLock && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="h-3 w-3" />
                          {timeLock}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <div className="relative flex shrink-0 flex-col items-end gap-1.5">
                      {isCompleted ? (
                        <>
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <Flame className="h-3.5 w-3.5" />
                            Đã phun trào
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setReviewDay(d)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                            >
                              <Eye className="h-3 w-3" />
                              Xem lại
                            </button>
                            <button
                              onClick={() => {
                                triggerLavaBurst();
                                setTimeout(() => setSelectedDay(d), 400);
                              }}
                              className="flex items-center gap-1 rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Làm lại
                            </button>
                          </div>
                        </>
                      ) : isAvailable ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            triggerLavaBurst();
                            setTimeout(() => setSelectedDay(d), 400);
                          }}
                          className="!px-4 !py-2"
                        >
                          Vào chặng
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">
                          Khoá
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Volcanic eruption summit teaser */}
        <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-red-900 via-orange-800 to-red-900 p-6 text-white shadow-lg animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 opacity-30">
              <VolcanoParticleFX intensity="high" />
            </div>
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <MountainSnow className="h-6 w-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  Đỉnh Núi Lửa · Phun Trào Nhận Thức
                </p>
                <p className="text-xs text-orange-200/70">
                  Hoàn thành 7 chặng để kích hoạt phun trào núi lửa toàn màn hình — chứng minh tư duy đã bùng nổ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <DayDetailModal
          day={selectedDay}
          progress={progress[selectedDay.day]}
          userId={user?.id || 'anonymous'}
          onComplete={(debateRounds, debateEvaluated, submission) =>
            completeDay(selectedDay.day, debateRounds, debateEvaluated, submission)
          }
          onClose={() => setSelectedDay(null)}
          onNavigate={onNavigate}
        />
      )}

      {/* Review modal for completed submissions */}
      {reviewDay && (
        <ReviewModal
          day={reviewDay}
          submission={progress[reviewDay.day]?.submission || null}
          debateRounds={progress[reviewDay.day]?.debateRounds || 0}
          debateEvaluated={progress[reviewDay.day]?.debateEvaluated || false}
          completedAt={progress[reviewDay.day]?.completedAt || null}
          onClose={() => setReviewDay(null)}
        />
      )}
    </div>
  );
}

function DayDetailModal({
  day,
  progress,
  userId,
  onComplete,
  onClose,
  onNavigate,
}: {
  day: RoadmapDay;
  progress?: DayProgress;
  userId: string;
  onComplete: (debateRounds?: number, debateEvaluated?: boolean, submission?: SavedSubmission | null) => void;
  onClose: () => void;
  onNavigate: (page: Page) => void;
}) {
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [shake, setShake] = useState(false);
  const [spamToast, setSpamToast] = useState<string | null>(null);

  // Debate state
  const [debateMsgs, setDebateMsgs] = useState<DebateMessage[]>([]);
  const [debateInput, setDebateInput] = useState('');
  const [debateRounds, setDebateRounds] = useState(progress?.debateRounds || 0);
  const [debateEval, setDebateEval] = useState<DebateEval | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'pro' | 'anti'>('pro');
  const [writingFeedback, setWritingFeedback] = useState<RoadmapFeedback | null>(null);

  const isDebate = day.type === 'debate';
  const isTemplate = day.type === 'challenge';
  const isSpeed = day.type === 'speed';
  const isSummit = day.type === 'summit';

  const startDebate = () => {
    const firstArg = day.day >= 5
      ? ADVANCED_DEBATE_TOPICS[0]
      : PRO_AI_ARGUMENTS[0];
    setDebateMsgs([{ role: 'pro', text: firstArg }]);
    setCurrentTurn('anti');
  };

  const submitDebateArg = () => {
    if (!debateInput.trim()) return;
    const newMsgs: DebateMessage[] = [...debateMsgs, { role: 'student', text: debateInput }];
    setDebateInput('');
    const newRounds = debateRounds + 1;
    setDebateRounds(newRounds);

    const aiArgs = currentTurn === 'pro' ? ANTI_AI_ARGUMENTS : PRO_AI_ARGUMENTS;
    const aiArg = aiArgs[newRounds % aiArgs.length];
    newMsgs.push({ role: currentTurn === 'pro' ? 'anti' : 'pro', text: aiArg });
    setDebateMsgs(newMsgs);
    setCurrentTurn(currentTurn === 'pro' ? 'anti' : 'pro');
  };

  const evaluateDebate = () => {
    setEvaluating(true);
    setTimeout(() => {
      const studentArgs = debateMsgs.filter(m => m.role === 'student');
      const totalText = studentArgs.map(m => m.text).join(' ');
      const wc = totalText.trim().split(/\s+/).filter(Boolean).length;
      const uniqueWords = new Set(totalText.toLowerCase().split(/\s+/).filter(Boolean)).size;

      const logicScore = Math.min(40 + wc / 10 + debateRounds * 8, 100);
      const vocabScore = Math.min(35 + wc / 8 + (totalText.match(/phản biện|luận điểm|bằng chứng|suy luận|mâu thuẫn/gi) || []).length * 12, 100);
      const depthScore = Math.min(30 + wc / 6 + debateRounds * 10, 100);
      const total = Math.round((logicScore + vocabScore + depthScore) / 3);
      const logicIndex = Math.round(Math.min((logicScore / 100) * 5, 5));

      const ctx: FeedbackContext = {
        score: total,
        logicIndex,
        uniqueWords,
        totalWords: wc,
        wpm: 0,
        debateRounds,
        fallacyCount: 0,
        repetitionCount: 0,
        clicheCount: 0,
        idleSeconds: 0,
        tabViolations: 0,
        userId,
        timestamp: Date.now(),
        rawText: totalText,
      };
      const evalResult = generateDebateEval(ctx);

      setDebateEval({
        logic: Math.round(logicScore),
        vocab: Math.round(vocabScore),
        depth: Math.round(depthScore),
        total,
        strengths: evalResult.strengths,
        weaknesses: evalResult.weaknesses,
        suggestion: evalResult.suggestion,
      });
      setEvaluating(false);
    }, 1500);
  };

  const canCompleteDebate = debateRounds >= 2 && debateEval !== null;
  const wc = response.trim().split(/\s+/).filter(Boolean).length;
  const canCompleteWriting = wc >= 30;

  const triggerShake = () => {
    setShake(true);
    setSpamToast(getRandomSpamToast());
    setTimeout(() => setShake(false), 600);
    setTimeout(() => setSpamToast(null), 4000);
  };

  const handleWritingSubmit = () => {
    if (wc < 30) {
      triggerShake();
      return;
    }
    const words = response.toLowerCase().split(/\s+/).filter(Boolean);
    const uniqueWords = new Set(words).size;
    const score = Math.min(40 + wc / 3 + uniqueWords / 2, 100);
    const logicIndex = Math.round(Math.min((score / 100) * 5, 5));
    const ctx: FeedbackContext = {
      score: Math.round(score),
      logicIndex,
      uniqueWords,
      totalWords: wc,
      wpm: 0,
      debateRounds: 0,
      fallacyCount: 0,
      repetitionCount: 0,
      clicheCount: 0,
      idleSeconds: 0,
      tabViolations: 0,
      userId,
      timestamp: Date.now(),
      rawText: response,
    };
    const feedback = generateRoadmapFeedback(day.day, ctx);
    setWritingFeedback(feedback);
    setSubmitted(true);
    onComplete(0, false, { text: response, score: Math.round(score), feedback, type: 'writing' });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in dark:bg-slate-900 ${shake ? 'animate-shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white">
              {day.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {day.title}
              </h3>
              <p className="text-xs text-slate-400">
                {day.subtitle} · {day.altitude}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Anti-spam toast */}
          {spamToast && (
            <div className="mb-4 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white animate-fade-in-up">
              {spamToast}
            </div>
          )}

          <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {day.desc}
          </p>

          {isTemplate ? (
            <TemplateDismantlingStation onComplete={() => { setSubmitted(true); onComplete(0, false, { text: 'Hoàn thành tháo mẫu AI', score: 0, feedback: { depth: '', vocab: '', advice: '' }, type: 'challenge' }); }} />
          ) : isSpeed ? (
            <SpeedRebuttalStation onComplete={() => { setSubmitted(true); onComplete(0, false, { text: 'Hoàn thành tăng tốc phản biện', score: 0, feedback: { depth: '', vocab: '', advice: '' }, type: 'speed' }); }} />
          ) : isSummit ? (
            <SummitAssessmentStation onComplete={() => { setSubmitted(true); onComplete(0, false, { text: 'Hoàn thành đỉnh núi lửa', score: 0, feedback: { depth: '', vocab: '', advice: '' }, type: 'summit' }); }} />
          ) : isDebate ? (
            <div className="space-y-4">
              {debateMsgs.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-6 text-center dark:bg-slate-800/50">
                  <Swords className="mx-auto mb-3 h-10 w-10 text-red-500" />
                  <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                    Sẵn sàng tranh luận với hai phe AI?
                    <br />
                    <strong>Phe Pro-AI</strong> bảo vệ AI, <strong>Phe Anti-AI</strong> chỉ ra rủi ro.
                    <br />
                    Nhiệm vụ: phản biện lại cả hai phe.
                  </p>
                  <Button onClick={startDebate}>
                    <Swords className="h-4 w-4" />
                    Bắt đầu tranh luận
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    {debateMsgs.map((m, i) => (
                      <div key={i} className={`flex gap-2 ${m.role === 'student' ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          m.role === 'pro' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : m.role === 'anti' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
                        }`}>
                          {m.role === 'student' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          m.role === 'student' ? 'bg-brand-500 text-white'
                            : m.role === 'pro' ? 'bg-blue-100 text-slate-700 dark:bg-blue-900/30 dark:text-slate-200'
                              : 'bg-red-100 text-slate-700 dark:bg-red-900/30 dark:text-slate-200'
                        }`}>
                          <p className="mb-0.5 text-xs font-bold opacity-70">
                            {m.role === 'pro' ? 'Pro-AI Bot' : m.role === 'anti' ? 'Anti-AI Bot' : 'Bạn'}
                          </p>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={debateInput}
                      onChange={(e) => setDebateInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitDebateArg()}
                      placeholder="Nhập lập luận phản biện..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                    <Button onClick={submitDebateArg} className="!px-4">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Lượt phản biện: <strong className="text-brand-600 dark:text-brand-400">{debateRounds}</strong> / 2 yêu cầu
                    </span>
                    {debateRounds >= 2 && !debateEval && (
                      <Button variant="secondary" onClick={evaluateDebate} disabled={evaluating} className="!py-1.5 !text-xs">
                        {evaluating ? 'AI đang đánh giá...' : 'Yêu cầu AI đánh giá'}
                      </Button>
                    )}
                  </div>

                  {debateEval && (
                    <div className="rounded-xl border-2 border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
                      <div className="mb-3 flex items-center gap-2">
                        <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Bảng đánh giá phản biện</p>
                      </div>
                      <div className="mb-3 grid grid-cols-3 gap-2">
                        <EvalScore label="Logic" score={debateEval.logic} />
                        <EvalScore label="Từ vựng" score={debateEval.vocab} />
                        <EvalScore label="Độ sâu" score={debateEval.depth} />
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="text-emerald-700 dark:text-emerald-400"><strong>Điểm mạnh:</strong> {debateEval.strengths}</p>
                        <p className="text-red-600 dark:text-red-400"><strong>Lỗ hổng:</strong> {debateEval.weaknesses}</p>
                        <p className="text-brand-600 dark:text-brand-400"><strong>Gợi ý:</strong> {debateEval.suggestion}</p>
                      </div>
                      <div className="mt-3 rounded-lg bg-amber-200/50 px-3 py-2 text-center dark:bg-amber-800/30">
                        <span className="text-lg font-bold text-amber-800 dark:text-amber-300">
                          Tổng điểm: {debateEval.total}/100
                        </span>
                      </div>
                    </div>
                  )}

                  {!canCompleteDebate && (
                    <div className="flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>
                        Cần ít nhất <strong>2 lượt phản biện</strong> và <strong>nhận đánh giá AI</strong>.
                        {debateRounds < 2 && ` (Còn ${2 - debateRounds} lượt)`}
                        {debateRounds >= 2 && !debateEval && ' (Nhấn "Yêu cầu AI đánh giá")'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Writing input */
            <div className="space-y-4">
              {writingFeedback && submitted ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 dark:border-orange-800/50 dark:bg-orange-900/20">
                    <div className="mb-3 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Phản hồi chặng {day.day}</p>
                    </div>
                    <div className="space-y-3 text-xs leading-relaxed">
                      <div>
                        <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">🔥 Phân tích Nội dung & Lập luận</p>
                        <p className="text-slate-600 dark:text-slate-300">{writingFeedback.depth}</p>
                      </div>
                      <div>
                        <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">🪨 Khả năng diễn đạt & Từ vựng</p>
                        <p className="text-slate-600 dark:text-slate-300">{writingFeedback.vocab}</p>
                      </div>
                      <div>
                        <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">🌋 Tính sáng tạo & Lời khuyên</p>
                        <p className="text-slate-600 dark:text-slate-300">{writingFeedback.advice}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Viết tự do — không ai phán xét lúc đang viết. Mọi chấm điểm chỉ xảy ra khi nộp."
                    className="h-40 w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <p className="text-xs text-slate-400">
                    {wc} từ · Cần ít nhất 30 từ
                  </p>
                  {!canCompleteWriting && wc > 0 && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-500 dark:bg-red-900/20">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      Viết thêm để hoàn thành — {30 - wc} từ nữa.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5 dark:border-slate-700">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          {!isTemplate && !isSpeed && !isSummit && (
            <Button
              onClick={() => {
                if (isDebate) {
                  setSubmitted(true);
                  const studentArgs = debateMsgs.filter(m => m.role === 'student');
                  const totalText = studentArgs.map(m => m.text).join(' ');
                  const feedback = generateRoadmapFeedback(day.day, {
                    score: debateEval?.total || 0,
                    logicIndex: Math.round(Math.min(((debateEval?.logic || 0) / 100) * 5, 5)),
                    uniqueWords: new Set(totalText.toLowerCase().split(/\s+/).filter(Boolean)).size,
                    totalWords: totalText.trim().split(/\s+/).filter(Boolean).length,
                    wpm: 0,
                    debateRounds,
                    fallacyCount: 0,
                    repetitionCount: 0,
                    clicheCount: 0,
                    idleSeconds: 0,
                    tabViolations: 0,
                    userId,
                    timestamp: Date.now(),
                    rawText: totalText,
                  });
                  onComplete(debateRounds, !!debateEval, { text: totalText, score: debateEval?.total || 0, feedback, type: 'debate' });
                } else {
                  handleWritingSubmit();
                }
              }}
              disabled={isDebate ? !canCompleteDebate : !canCompleteWriting}
            >
              <CheckCircle2 className="h-4 w-4" />
              Hoàn thành chặng
            </Button>
          )}
          {submitted && (
            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Đã hoàn thành!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EvalScore({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-500';
  const barColor = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{score}</p>
      <div className="mx-auto mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function ReviewModal({
  day,
  submission,
  debateRounds,
  debateEvaluated,
  completedAt,
  onClose,
}: {
  day: RoadmapDay;
  submission: SavedSubmission | null;
  debateRounds: number;
  debateEvaluated: boolean;
  completedAt: string | null;
  onClose: () => void;
}) {
  const fb = submission?.feedback;
  const isLegacy = !submission || (!submission.text && !submission.score && (!fb || (!fb.depth && !fb.vocab && !fb.advice)));
  const completedDate = completedAt ? new Date(completedAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Bài làm chặng {day.day} · {day.title}
              </h3>
              <p className="text-xs text-slate-400">
                {day.subtitle} · {day.altitude}{submission ? ` · ${submission.type}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Completion date */}
          {completedDate && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              Hoàn thành ngày {completedDate}
            </div>
          )}

          {/* Legacy notice */}
          {isLegacy && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-bold mb-1">Bài làm cũ chưa lưu chi tiết</p>
                  <p>Chặng này được hoàn thành trước khi hệ thống lưu bài viết. Nhấn "Làm lại" để thực hiện lại và lưu kết quả mới.</p>
                </div>
              </div>
            </div>
          )}

          {/* Debate metrics (if available) */}
          {(day.type === 'debate') && (debateRounds > 0 || debateEvaluated) && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-3">
                <Swords className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Kết quả tranh luận</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-blue-100/50 px-3 py-2 dark:bg-blue-900/30">
                  <p className="text-slate-500 dark:text-slate-400">Lượt phản biện</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{debateRounds}</p>
                </div>
                <div className="rounded-lg bg-blue-100/50 px-3 py-2 dark:bg-blue-900/30">
                  <p className="text-slate-500 dark:text-slate-400">Đánh giá AI</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{debateEvaluated ? 'Đã nhận' : 'Chưa'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Score */}
          {submission && submission.score > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800/50 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Tổng điểm: {submission.score}/100</p>
              </div>
            </div>
          )}

          {/* Student text */}
          {submission && submission.text && (
            <div>
              <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">Bài viết của em</p>
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 whitespace-pre-wrap">
                {submission.text}
              </div>
            </div>
          )}

          {/* Feedback matrix */}
          {fb && (fb.depth || fb.vocab || fb.advice) && (
            <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 dark:border-orange-800/50 dark:bg-orange-900/20">
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Phản hồi chặng {day.day}</p>
              </div>
              <div className="space-y-3 text-xs leading-relaxed">
                {fb.depth && (
                  <div>
                    <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">🔥 Phân tích Nội dung & Lập luận</p>
                    <p className="text-slate-600 dark:text-slate-300">{fb.depth}</p>
                  </div>
                )}
                {fb.vocab && (
                  <div>
                    <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">🪨 Khả năng diễn đạt & Từ vựng</p>
                    <p className="text-slate-600 dark:text-slate-300">{fb.vocab}</p>
                  </div>
                )}
                {fb.advice && (
                  <div>
                    <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">🌋 Tính sáng tạo & Lời khuyên</p>
                    <p className="text-slate-600 dark:text-slate-300">{fb.advice}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 p-5 dark:border-slate-700">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

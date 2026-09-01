import { useState, useEffect } from 'react';
import type { EssayResult, Scores, Badge, FeedbackCard } from '@/lib/scoring';
import { getRankTier, getDynamicFeedbackEmojiAnimated } from '@/lib/scoring';
import RadarChart from '@/components/charts/RadarChart';
import StackedBarChart from '@/components/charts/StackedBarChart';
import ScatterChart from '@/components/charts/ScatterChart';
import FireworksOverlay from '@/components/effects/FireworksOverlay';
import { Button } from '@/components/ui';
import {
  Award,
  TrendingUp,
  Download,
  CheckCircle2,
  Brain,
  Zap,
  Shield,
  BookOpen,
  Clock,
  Type,
  AlertTriangle,
  Timer,
  X,
  Share2,
  Music,
  Flame,
  Target,
  Ban,
  Sparkles,
} from 'lucide-react';

export default function AnalyticsDashboard({
  result,
  promptTitle,
  onDone,
}: {
  result: EssayResult;
  promptTitle: string;
  onDone: () => void;
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [fireworks, setFireworks] = useState(false);

  const { scores, telemetry, vocab, overall, isSpam, isViolation, violationReason, feedback } = result;

  // Trigger fireworks for 90+ scores (non-spam, non-violation)
  useEffect(() => {
    if (overall >= 90 && !isSpam && !isViolation) {
      setFireworks(true);
    }
  }, [overall, isSpam, isViolation]);

  const rankInfo = getRankTier(result.rankPoints || 0);
  const dynamicEmoji = getDynamicFeedbackEmojiAnimated(overall, isSpam, isViolation);

  const kpiCards = [
    {
      icon: <Award className="h-6 w-6" />,
      label: 'Tổng điểm',
      value: overall,
      max: 100,
      color: 'from-brand-500 to-brand-700',
      bg: 'bg-brand-50 dark:bg-brand-900/30',
      text: 'text-brand-600 dark:text-brand-300',
    },
    {
      icon: <Type className="h-6 w-6" />,
      label: 'Số từ',
      value: telemetry.wordCount,
      color: 'from-emerald-500 to-emerald-700',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-300',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      label: 'Tốc độ (từ/phút)',
      value: telemetry.wpm,
      color: 'from-amber-500 to-amber-700',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-300',
    },
    {
      icon: <Brain className="h-6 w-6" />,
      label: 'Từ vựng phản biện',
      value: vocab.critical,
      color: 'from-violet-500 to-violet-700',
      bg: 'bg-violet-50 dark:bg-violet-900/30',
      text: 'text-violet-600 dark:text-violet-300',
    },
  ];

  const scoreBreakdown: { key: keyof Scores; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'depth',
      label: 'Chiều sâu tư duy',
      icon: <Brain className="h-4 w-4" />,
      desc: 'Dựa trên độ dài bài viết và tỷ lệ từ vựng phản biện',
    },
    {
      key: 'fluency',
      label: 'Trôi chảy',
      icon: <TrendingUp className="h-4 w-4" />,
      desc: 'Tốc độ viết ổn định và ít lần xoá (backspace)',
    },
    {
      key: 'independence',
      label: 'Độc lập',
      icon: <Shield className="h-4 w-4" />,
      desc: 'Ít vi phạm chuyển tab và ít thời gian ngưng gõ',
    },
    {
      key: 'vocabularyCoherence',
      label: 'Mạch lạc từ vựng',
      icon: <BookOpen className="h-4 w-4" />,
      desc: 'Đa dạng từ độc nhất và tỷ lệ từ học thuật',
    },
    {
      key: 'speed',
      label: 'Tốc độ phản xạ',
      icon: <Zap className="h-4 w-4" />,
      desc: 'Tốc độ phản xạ viết chuẩn hoá theo thời gian',
    },
  ];

  const scatterPoints = [
    {
      x: Math.round(telemetry.idleSeconds * 0.2),
      y: Math.round(scores.depth * 0.9),
      idle: Math.round(telemetry.idleSeconds * 0.2),
      depth: Math.round(scores.depth * 0.9),
      label: 'Đầu phiên',
    },
    {
      x: Math.round(telemetry.idleSeconds * 0.4),
      y: Math.round(scores.depth * 0.75),
      idle: Math.round(telemetry.idleSeconds * 0.4),
      depth: Math.round(scores.depth * 0.75),
      label: '1/3 phiên',
    },
    {
      x: Math.round(telemetry.idleSeconds * 0.6),
      y: Math.round(scores.depth * 0.85),
      idle: Math.round(telemetry.idleSeconds * 0.6),
      depth: Math.round(scores.depth * 0.85),
      label: 'Giữa phiên',
    },
    {
      x: Math.round(telemetry.idleSeconds * 0.8),
      y: Math.round(scores.depth * 0.7),
      idle: Math.round(telemetry.idleSeconds * 0.8),
      depth: Math.round(scores.depth * 0.7),
      label: '2/3 phiên',
    },
    {
      x: Math.max(Math.round(telemetry.idleSeconds), 5),
      y: scores.depth,
      idle: Math.max(Math.round(telemetry.idleSeconds), 5),
      depth: scores.depth,
      label: 'Cuối phiên',
    },
  ];

  const handleExportCSV = () => {
    const rows = [
      ['Trường', 'Giá trị'],
      ['Đề bài', promptTitle],
      ['Tổng điểm', overall.toString()],
      ['Số từ', telemetry.wordCount.toString()],
      ['Số ký tự', telemetry.charCount.toString()],
      ['Tốc độ (từ/phút)', telemetry.wpm.toString()],
      ['Số lần backspace', telemetry.backspaceCount.toString()],
      ['Vi phạm chuyển tab', telemetry.tabViolations.toString()],
      ['Thời gian ngưng (giây)', telemetry.idleSeconds.toString()],
      ['Thời gian làm bài (giây)', telemetry.durationSeconds.toString()],
      ['Chiều sâu', scores.depth.toString()],
      ['Trôi chảy', scores.fluency.toString()],
      ['Độc lập', scores.independence.toString()],
      ['Mạch lạc từ vựng', scores.vocabularyCoherence.toString()],
      ['Tốc độ', scores.speed.toString()],
      ['Từ phổ thông', vocab.common.toString()],
      ['Từ phản biện', vocab.critical.toString()],
      ['Từ độc nhất', vocab.unique.toString()],
      ['Sáo rỗng', vocab.clicheHits.toString()],
      ['Spam', isSpam ? 'Yes' : 'No'],
      ['Vi phạm', isViolation ? 'Yes' : 'No'],
      ['Lý do vi phạm', violationReason],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phan-tich-bai-luan-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      prompt: promptTitle,
      overall,
      scores,
      telemetry,
      vocabulary: vocab,
      essay: result.text,
      isSpam,
      isViolation,
      violationReason,
      feedback,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `du-lieu-nghien-cuu-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Violation/Spam banner ---
  if (isViolation) {
    return (
      <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-red-50 p-8 text-center shadow-lg dark:bg-red-900/20 animate-scale-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
              <Ban className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-red-700 dark:text-red-400">
              Vi phạm luật chơi
            </h1>
            <p className="mb-6 text-sm text-red-600 dark:text-red-400/80">
              {violationReason}
            </p>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Hệ thống đã khoá bản ghi này. Điểm số bị triệt tiêu và không ghi nhận vào xếp hạng.
              Vui lòng viết lại bằng ngôn ngữ phù hợp.
            </p>
            <Button onClick={onDone} className="w-full">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6">
      <FireworksOverlay trigger={fireworks} onDone={() => setFireworks(false)} />
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="mb-3 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSpam ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300'}`}>
              {isSpam ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isSpam ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
              {isSpam ? 'Bài viết bị đánh dấu spam' : 'Đã hoàn thành phiên làm bài'}
            </span>
            {/* Big dynamic reactive emoji */}
            <span
              className={`ml-auto text-4xl ${dynamicEmoji.animation}`}
              key={dynamicEmoji.emoji}
            >
              {dynamicEmoji.emoji}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
            Bảng phân tích đa chiều
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Đề bài: <span className="font-medium text-slate-700 dark:text-slate-300">{promptTitle}</span>
          </p>
          {/* Gen-Z rank slang badge */}
          {!isViolation && (
            <div className="mt-3 flex items-center gap-2">
              <div className={`flex items-center gap-2 rounded-full bg-gradient-to-r ${rankInfo.color} px-4 py-1.5 text-white shadow-md`}>
                <span className="text-base">{rankInfo.emoji}</span>
                <span className="text-sm font-bold">{rankInfo.slang}</span>
              </div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {result.rankPoints || 0} clout points
              </span>
            </div>
          )}
        </div>

        {/* KPI Scorecards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 animate-fade-in-up">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className="group relative overflow-hidden rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-md transition hover:shadow-lg dark:bg-slate-800/60"
            >
              <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${kpi.color} opacity-10`} />
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${kpi.bg} ${kpi.text}`}>
                {kpi.icon}
              </div>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                {kpi.label}
              </p>
              {kpi.max && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${kpi.color}`}
                    style={{ width: `${Math.min((kpi.value / kpi.max) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in-up">
          <div className="rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur-md dark:bg-slate-800/60">
            <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-slate-100">
              Biểu đồ Radar 5 trục
            </h3>
            <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
              So sánh điểm của bạn với mức trung bình
            </p>
            <div className="flex justify-center">
              <RadarChart scores={scores} />
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-brand-500" />
                <span className="text-slate-600 dark:text-slate-300">Điểm của bạn</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-slate-400 border-dashed" />
                <span className="text-slate-600 dark:text-slate-300">Mức trung bình</span>
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur-md dark:bg-slate-800/60">
            <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-slate-100">
              Biểu đồ phân tán
            </h3>
            <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
              Thời gian ngưng gõ vs. Điểm chiều sâu — phát hiện tê liệt biểu đạt
            </p>
            <div className="flex justify-center">
              <ScatterChart points={scatterPoints} />
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-brand-500" />
                <span className="text-slate-600 dark:text-slate-300">Bình thường</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-slate-600 dark:text-slate-300">Ngưỡng tê liệt</span>
              </span>
            </div>
          </div>
        </div>

        {/* Stacked bar chart */}
        <div className="mb-8 rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur-md dark:bg-slate-800/60 animate-fade-in-up">
          <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-slate-100">
            Biểu đồ thành phần từ vựng theo thời gian
          </h3>
          <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
            Diễn tiến tỷ lệ từ phổ thông vs. từ phản biện học thuật
          </p>
          <div className="overflow-x-auto">
            {result.vocab.total > 0 ? (
              <StackedBarChart segments={vocabHistorySample(vocab)} />
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                Chưa có đủ dữ liệu từ vựng
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-300">Từ phổ thông / sáo rỗng</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-brand-500" />
              <span className="text-slate-600 dark:text-slate-300">Từ phản biện / học thuật</span>
            </span>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mb-8 animate-fade-in-up">
          <h3 className="mb-4 text-base font-bold text-slate-800 dark:text-slate-100">
            Chi tiết điểm số từng tiêu chí
          </h3>
          <div className="space-y-3">
            {scoreBreakdown.map((s) => {
              const val = scores[s.key];
              const tone =
                val >= 70 ? 'text-green-600 dark:text-green-400'
                  : val >= 40 ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-500 dark:text-red-400';
              const barTone =
                val >= 70 ? 'from-green-400 to-green-600'
                  : val >= 40 ? 'from-amber-400 to-amber-600'
                    : 'from-red-400 to-red-600';
              return (
                <div key={s.key} className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:bg-slate-800/60">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                        {s.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.label}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{s.desc}</p>
                      </div>
                    </div>
                    <span className={`text-xl font-bold ${tone}`}>{val}<span className="text-sm text-slate-400">/100</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div className={`h-full rounded-full bg-gradient-to-r ${barTone} transition-all duration-700`} style={{ width: `${val}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telemetry detail */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 animate-fade-in-up">
          <TelemetryCard icon={<Type className="h-4 w-4" />} label="Số từ" value={telemetry.wordCount} />
          <TelemetryCard icon={<Clock className="h-4 w-4" />} label="Thời gian (phút)" value={Math.round(telemetry.durationSeconds / 60)} />
          <TelemetryCard icon={<Zap className="h-4 w-4" />} label="Từ/phút" value={telemetry.wpm} />
          <TelemetryCard icon={<AlertTriangle className="h-4 w-4" />} label="Vi phạm tab" value={telemetry.tabViolations} danger={telemetry.tabViolations > 0} />
          <TelemetryCard icon={<Timer className="h-4 w-4" />} label="Ngưng gõ (giây)" value={telemetry.idleSeconds} />
          <TelemetryCard icon={<Type className="h-4 w-4" />} label="Từ độc nhất" value={vocab.unique} />
        </div>

        {/* Glassmorphism Feedback Cards — Gen-Z LLM Roasts */}
        {feedback.length > 0 && (
          <div className="mb-8 animate-fade-in-up">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  AI Roast & Feedback
                </h3>
                <p className="text-xs text-slate-400">Phân tích sâu từ AI — không có sáo rỗng</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {feedback.map((card, i) => (
                <FeedbackCardView key={i} card={card} index={i} overall={overall} />
              ))}
            </div>
          </div>
        )}

        {/* Cognitive Wrapped */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 p-6 text-white shadow-lg animate-fade-in-up sm:p-8">
          <div className="mb-5 flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-400" />
            <h3 className="text-xl font-bold text-white">Bản tin bóc phốt não bộ</h3>
            <span className="ml-2 rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-brand-200">
              Cognitive Wrapped
            </span>
          </div>

          <div className="mb-6 rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-200">
              <span className="text-lg">🎨</span>
              Màu cảm xúc của bạn
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {getEmotionalColors(scores, telemetry).map((c, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${c.color} px-3 py-1.5 text-sm font-semibold text-white shadow-md`}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-200">
              <Music className="h-4 w-4" />
              Nhịp điệu viết của bạn
            </p>
            <AudioWave wpm={telemetry.wpm} idleSeconds={telemetry.idleSeconds} wordCount={telemetry.wordCount} />
            <p className="mt-3 text-xs text-brand-200/60">
              Sóng âm mô phỏng nhịp viết: {telemetry.wpm} từ/phút · {telemetry.idleSeconds}s ngưng gõ
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-200">
              <Target className="h-4 w-4" />
              Huy hiệu đạt được ({result.badges?.length || 0})
            </p>
            {result.badges && result.badges.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {result.badges.map((badge: Badge) => (
                  <div key={badge.id} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 transition hover:bg-white/15">
                    <span className="text-3xl">{badge.emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{badge.label}</p>
                      <p className="text-xs text-brand-200/70">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-200/60">
                Chưa đạt huy hiệu nào — thử làm bài tập trung hơn lần sau!
              </p>
            )}
          </div>

          <button
            onClick={() => {
              const shareText = `Tôi vừa đạt ${overall}/100 điểm trong thí nghiệm Semantic Drift! ${result.badges?.map((b: Badge) => b.emoji).join(' ') || ''}`;
              if (navigator.share) {
                navigator.share({ title: 'Bản tin não bộ của tôi', text: shareText });
              } else {
                navigator.clipboard.writeText(shareText);
              }
            }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <Share2 className="h-4 w-4" />
            Chia sẻ bản tin não bộ
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />
            Xuất dữ liệu nghiên cứu (CSV)
          </Button>
          <Button onClick={onDone}>
            <CheckCircle2 className="h-4 w-4" />
            Hoàn tất
          </Button>
        </div>
      </div>

      {/* Export modal */}
      {exportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setExportOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scale-in dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Xuất dữ liệu nghiên cứu</h3>
              <button
                onClick={() => setExportOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Chọn định dạng để tải về dữ liệu phân tích thống kê.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { handleExportCSV(); setExportOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <Download className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">CSV (Excel / Google Sheets)</p>
                  <p className="text-xs text-slate-400">Phù hợp phân tích thống kê</p>
                </div>
              </button>
              <button
                onClick={() => { handleExportJSON(); setExportOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Download className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">JSON (Dữ liệu thô)</p>
                  <p className="text-xs text-slate-400">Bao gồm toàn văn bài luận + telemetry</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Glassmorphism Feedback Card ---
function FeedbackCardView({ card, index, overall }: { card: FeedbackCard; index: number; overall: number }) {
  const { emoji, animation } = getDynamicFeedbackEmojiAnimated(overall, false, false);
  const toneStyles = {
    roast: {
      border: 'border-red-200/40 dark:border-red-800/30',
      glow: 'from-red-500/10 to-orange-500/5',
      iconBg: 'bg-red-100/60 dark:bg-red-900/30',
      label: 'Roast',
      labelBg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    },
    praise: {
      border: 'border-emerald-200/40 dark:border-emerald-800/30',
      glow: 'from-emerald-500/10 to-teal-500/5',
      iconBg: 'bg-emerald-100/60 dark:bg-emerald-900/30',
      label: 'Praise',
      labelBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    mixed: {
      border: 'border-amber-200/40 dark:border-amber-800/30',
      glow: 'from-amber-500/10 to-yellow-500/5',
      iconBg: 'bg-amber-100/60 dark:bg-amber-900/30',
      label: 'Mixed',
      labelBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    },
  };
  const style = toneStyles[card.tone];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl glass-feedback dark:glass-feedback-dark border ${style.border} p-5 shadow-sm transition hover:shadow-lg animate-fade-in-up`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${style.glow} blur-xl`} />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{card.icon}</span>
            {/* Dynamic reactive emoji that shifts based on score tier */}
            <span className={`text-xl ${animation}`} key={`${emoji}-${index}`}>
              {emoji}
            </span>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style.labelBg}`}>
            {style.label}
          </span>
        </div>
        <h4 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">
          {card.title}
        </h4>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {card.body}
        </p>
      </div>
    </div>
  );
}

function TelemetryCard({
  icon,
  label,
  value,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/80 p-3 text-center shadow-sm backdrop-blur-md dark:bg-slate-800/60">
      <span
        className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg ${
          danger
            ? 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'
            : 'bg-brand-50 text-brand-500 dark:bg-brand-900/30 dark:text-brand-300'
        }`}
      >
        {icon}
      </span>
      <p className={`text-lg font-bold ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
    </div>
  );
}

function vocabHistorySample(vocab: { common: number; critical: number }) {
  const segments = [
    { label: 'M1', common: Math.round(vocab.common * 0.2), critical: Math.round(vocab.critical * 0.1) },
    { label: 'M2', common: Math.round(vocab.common * 0.4), critical: Math.round(vocab.critical * 0.3) },
    { label: 'M3', common: Math.round(vocab.common * 0.6), critical: Math.round(vocab.critical * 0.5) },
    { label: 'M4', common: Math.round(vocab.common * 0.75), critical: Math.round(vocab.critical * 0.7) },
    { label: 'M5', common: Math.round(vocab.common * 0.9), critical: Math.round(vocab.critical * 0.85) },
    { label: 'M6', common: vocab.common, critical: vocab.critical },
  ];
  return segments;
}

function getEmotionalColors(scores: Scores, telemetry: { wpm: number; idleSeconds: number; tabViolations: number }) {
  const colors: { color: string; emoji: string; label: string }[] = [];
  if (scores.depth >= 70) colors.push({ color: 'from-violet-500 to-purple-600', emoji: '🧠', label: 'Sâu sắc' });
  if (scores.fluency >= 70) colors.push({ color: 'from-cyan-400 to-blue-500', emoji: '🌊', label: 'Trôi chảy' });
  if (scores.independence >= 70) colors.push({ color: 'from-emerald-400 to-green-600', emoji: '🛡️', label: 'Tự lực' });
  if (telemetry.idleSeconds > 60) colors.push({ color: 'from-amber-500 to-orange-600', emoji: '💤', label: 'Tê liệt biểu đạt' });
  if (telemetry.tabViolations > 0) colors.push({ color: 'from-red-500 to-rose-600', emoji: '⚠️', label: 'Phân tâm' });
  if (telemetry.wpm >= 25 && telemetry.wpm <= 35) colors.push({ color: 'from-teal-400 to-cyan-500', emoji: '🎵', label: 'Nhịp điệu ổn' });
  if (scores.speed >= 70) colors.push({ color: 'from-yellow-400 to-amber-500', emoji: '⚡', label: 'Nhanh nhạy' });
  if (colors.length === 0) colors.push({ color: 'from-slate-400 to-slate-600', emoji: '🌱', label: 'Đang phát triển' });
  return colors;
}

function AudioWave({ wpm, idleSeconds, wordCount }: { wpm: number; idleSeconds: number; wordCount: number }) {
  const bars = Array.from({ length: 32 }, (_, i) => {
    const base = Math.min(wpm / 40, 1);
    const idleFactor = Math.max(0, 1 - idleSeconds / 120);
    const phase = Math.sin(i * 0.5 + wordCount * 0.01) * 0.3 + 0.5;
    const height = Math.max(0.1, base * idleFactor * phase + 0.15);
    return Math.min(height, 1);
  });
  return (
    <div className="flex h-16 items-end gap-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-gradient-to-t from-brand-500 to-cyan-400 transition-all duration-300"
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
}

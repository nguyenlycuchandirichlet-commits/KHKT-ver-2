import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PROMPTS, type Prompt } from '@/lib/prompts';
import { detectTemplates } from '@/lib/scoring';
import { Button } from '@/components/ui';
import {
  FlaskConical,
  ShieldCheck,
  Clock,
  FileText,
  AlertTriangle,
  Lock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Brain,
  ScanLine,
  Music,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function BriefingScreen({
  onStart,
}: {
  onStart: (prompt: Prompt) => void;
}) {
  const { profile } = useAuth();
  const [selectedId, setSelectedId] = useState<number>(PROMPTS[0].id);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // AI-Detox scan
  const [aiDetoxText, setAiDetoxText] = useState('');
  const [aiDetoxOpen, setAiDetoxOpen] = useState(false);
  const [aiDetoxResult, setAiDetoxResult] = useState<{
    templates: { phrase: string; start: number }[];
    reliance: number;
    verdict: string;
  } | null>(null);

  // Lo-fi music via Web Audio API
  const [musicOn, setMusicOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    if (musicOn) {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.06;
      gainNode.connect(ctx.destination);

      const freqs = [261.63, 329.63, 392.0];
      const oscs: OscillatorNode[] = [];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.3 / (i + 1);
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start();
        oscs.push(osc);
      });

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);
      lfo.start();
      oscs.push(lfo);

      oscillatorsRef.current = oscs;
    } else {
      oscillatorsRef.current.forEach((o) => {
        try { o.stop(); } catch { /* already stopped */ }
      });
      oscillatorsRef.current = [];
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    }
    return () => {
      oscillatorsRef.current.forEach((o) => {
        try { o.stop(); } catch { /* already stopped */ }
      });
      audioCtxRef.current?.close();
    };
  }, [musicOn]);

  const selected = PROMPTS.find((p) => p.id === selectedId) || PROMPTS[0];

  const runAiDetox = () => {
    const templates = detectTemplates(aiDetoxText);
    const wc = aiDetoxText.trim().split(/\s+/).filter(Boolean).length;
    const reliance = Math.min(templates.length * 15 + Math.max(0, 50 - wc) * 0.3, 100);
    let verdict = '';
    if (reliance < 20) verdict = 'Mức phụ thuộc thấp — bạn viết khá tự chủ!';
    else if (reliance < 50) verdict = 'Mức phụ thuộc trung bình — có dấu hiệu dùng mẫu AI.';
    else verdict = 'Mức phụ thuộc cao — nhiều cụm từ mẫu AI được phát hiện.';
    setAiDetoxResult({ templates, reliance: Math.round(reliance), verdict });
  };

  const rules = [
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'No-AI Lockdown',
      desc: 'Khoá hoàn toàn copy/paste, chuột phải, chọn văn bản. Không AI, không trợ lý.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: 'Phát hiện chuyển tab',
      desc: 'Mỗi lần chuyển tab, thu nhỏ trình duyệt hoặc click ra ngoài được ghi nhận vi phạm.',
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Chống chụp màn hình',
      desc: 'Watermark động hiển thị tên tài khoản + CSS bảo vệ để răn đe chụp ảnh.',
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Giới hạn 15 phút',
      desc: 'Đồng hồ đếm ngược 15:00 bắt đầu khi bạn nhấn "Bắt đầu thử thách".',
    },
  ];

  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
              <FlaskConical className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              Phòng thí nghiệm viết kín · No-AI Lockdown
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
            Chuẩn bị thí nghiệm nhận thức
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Chào {profile?.full_name || 'học sinh'}, hãy đọc kỹ hướng dẫn, quét AI-Detox
            và chọn đề bài trước khi bắt đầu.
          </p>
        </div>

        {/* Visual Priming — right-brain stimulation */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 p-6 shadow-lg animate-fade-in-up">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5 text-brand-400" />
                <span className="text-sm font-bold text-white">Kích thích bán cầu não phải</span>
              </div>
              <p className="text-sm leading-relaxed text-brand-100/80">
                Hình động trừu tượng về AI và nhận thức con người giúp kích hoạt sáng
                tạo trước khi viết. Bật nhạc Lo-fi Focus để tạo tâm trạng tập trung.
              </p>
            </div>
            <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
              <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-brand-400/30" />
              <div className="absolute inset-2 rounded-full border-2 border-cyan-400/20 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '8s' }} />
              <div className="absolute inset-4 animate-pulse rounded-full bg-gradient-to-br from-brand-500/40 to-cyan-500/30 blur-sm" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white/80 animate-pulse" />
              </div>
            </div>
          </div>
          <button
            onClick={() => setMusicOn((v) => !v)}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
              musicOn
                ? 'bg-brand-500 text-white'
                : 'bg-white/10 text-brand-100 hover:bg-white/20'
            }`}
          >
            <Music className="h-4 w-4" />
            {musicOn ? 'Đang phát Lo-fi Focus — Nhấn để tắt' : 'Bật Lo-fi Focus Beats'}
          </button>
        </div>

        {/* AI-Detox Scan */}
        <div className="mb-8 animate-fade-in-up">
          <div className="rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur-md dark:bg-slate-800/60">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                <ScanLine className="h-5 w-5 text-brand-500" />
                AI-Detox Scan (tùy chọn)
              </h2>
              <button
                onClick={() => setAiDetoxOpen((v) => !v)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                {aiDetoxOpen ? 'Thu gọn' : 'Mở quét'}
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Dán đoạn chat prompt gần nhất với AI để phân tích mức phụ thuộc và
              các cụm từ mẫu AI bạn hay dùng.
            </p>
            {aiDetoxOpen && (
              <div className="space-y-3">
                <textarea
                  value={aiDetoxText}
                  onChange={(e) => setAiDetoxText(e.target.value)}
                  placeholder="Dán đoạn văn hoặc prompt bạn thường gửi cho AI..."
                  className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <Button variant="secondary" onClick={runAiDetox} className="!py-2">
                  <ScanLine className="h-4 w-4" />
                  Quét phân tích
                </Button>
                {aiDetoxResult && (
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              aiDetoxResult.reliance < 20
                                ? 'bg-green-500'
                                : aiDetoxResult.reliance < 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${aiDetoxResult.reliance}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
                        {aiDetoxResult.reliance}%
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {aiDetoxResult.verdict}
                    </p>
                    {aiDetoxResult.templates.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-1.5 text-xs font-semibold text-slate-400">
                          Cụm từ mẫu AI phát hiện:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiDetoxResult.templates.map((t, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            >
                              "{t.phrase}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Experiment introduction */}
        <div className="mb-8 rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur-md dark:bg-slate-800/60 animate-fade-in-up">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
            <FileText className="h-5 w-5 text-brand-500" />
            Giới thiệu thí nghiệm nhận thức
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              Thí nghiệm này nghiên cứu <strong>Sự trôi dạt ngữ nghĩa (Semantic Drift)</strong>{' '}
              — hiện tượng cách học sinh biểu đạt tư duy phức tạp biến đổi trong
              bối cảnh AI ngày càng phổ biến.
            </p>
            <p>
              Bạn sẽ viết một bài nghị luận phản biện trong 15 phút. Hệ thống ghi
              nhận <strong>trôi chảy (fluency)</strong>,{' '}
              <strong>chiều sâu (depth)</strong>,{' '}
              <strong>độc lập (independence)</strong>, và phát hiện{' '}
              <strong>tê liệt biểu đạt (Expressive Paralysis)</strong> qua thời
              gian ngưng gõ.
            </p>
          </div>
        </div>

        {/* Rules */}
        <div className="mb-8 animate-fade-in-up">
          <h2 className="mb-4 text-base font-bold text-slate-800 dark:text-slate-100">
            Quy tắc No-AI Lockdown
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rules.map((r) => (
              <div
                key={r.title}
                className="flex items-start gap-3 rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:bg-slate-800/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400">
                  {r.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {r.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {r.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt selection */}
        <div className="mb-8 animate-fade-in-up">
          <h2 className="mb-4 text-base font-bold text-slate-800 dark:text-slate-100">
            Chọn đề bài nghị luận
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PROMPTS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedId(p.id);
                  setPreviewOpen(true);
                }}
                className={`group flex items-start gap-3 rounded-xl p-4 text-left transition-all ${
                  selectedId === p.id
                    ? 'border-2 border-brand-400 bg-brand-50/50 dark:bg-brand-900/20'
                    : 'border border-slate-200 bg-white/80 hover:border-brand-200 dark:border-slate-700 dark:bg-slate-800/60'
                } backdrop-blur-md`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    selectedId === p.id
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                  }`}
                >
                  {p.id}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {p.title}
                  </p>
                  {selectedId === p.id && (
                    <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">
                      Đã chọn — nhấn để xem mô tả
                    </p>
                  )}
                </div>
                {selectedId === p.id && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview modal */}
        {previewOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setPreviewOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">
                {selected.title}
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {selected.description}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setPreviewOpen(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Chọn đề khác
                </Button>
                <Button
                  onClick={() => {
                    setPreviewOpen(false);
                    setAgreed(true);
                  }}
                  className="flex-1"
                >
                  Chọn đề này
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Agreement + Start */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-lg animate-fade-in-up">
          <label className="mb-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 rounded accent-white"
            />
            <span className="text-sm leading-relaxed text-brand-50">
              Tôi đã đọc và đồng ý tuân thủ quy tắc No-AI Lockdown. Tôi hiểu
              rằng mọi vi phạm sẽ được ghi nhận vào dữ liệu nghiên cứu.
            </span>
          </label>
          <Button
            onClick={() => onStart(selected)}
            disabled={!agreed}
            className="w-full bg-white text-brand-700 hover:bg-brand-50"
          >
            <Zap className="h-5 w-5" />
            Bắt đầu thử thách — 15:00
          </Button>
          {!agreed && (
            <p className="mt-3 text-center text-xs text-brand-200/70">
              Vui lòng đánh dấu đồng ý quy tắc để bắt đầu
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

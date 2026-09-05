import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PROMPTS, type Prompt } from '@/lib/prompts';
import {
  calculateScores,
  wordCount,
  findRepeatedWords,
  detectTemplates,
  type Telemetry,
  type EssayResult,
} from '@/lib/scoring';
import { Button } from '@/components/ui';
import {
  Clock,
  AlertTriangle,
  ShieldAlert,
  Send,
  Sparkles,
  Eye,
  X,
  RefreshCw,
  Type,
  Activity,
  Flame,
} from 'lucide-react';

const ESSAY_DURATION = 15 * 60;
const IDLE_THRESHOLD = 12;

const SOCRATIC_PROMPTS = [
  'Bạn có thể lập luận từ một góc nhìn khác không?',
  'Đâu là bằng chứng mạnh nhất cho luận điểm của bạn?',
  'Có thể có phản biện nào cho ý này không?',
  'Bạn đang dùng "từ khoá" hay đang thực sự diễn đạt tư duy?',
  'Hãy thử thay "tốt/xấu" bằng một từ cụ thể hơn.',
  'Người đọc chưa quen đề tài sẽ hiểu đoạn này thế nào?',
  'Luận điểm chính của bạn có bị lặp không? Hãy mở rộng.',
  'Bạn có đang kết luận quá sớm? Cần thêm phân tích gì?',
  'Đoạn này nghe có vẻ giống văn mẫu AI — bạn có thể diễn đạt lại bằng giọng văn của riêng mình?',
  'Thử thay cụm "trong thời đại ngày nay" bằng một quan sát cụ thể hơn.',
  'Bạn đang viết điều mình nghĩ, hay đang viết điều AI nghĩ thay bạn?',
];

const TEMPLATE_CHALLENGES: Record<string, string> = {
  'trong thời đại ngày nay': 'Cụm "trong thời đại ngày nay" rất phổ biến trong văn AI. Hãy thay bằng một quan sát cụ thể về thời điểm hoặc bối cảnh.',
  'như chúng ta đã biết': '"Như chúng ta đã biết" là câu mở đầu sáo rỗng. Hãy bắt đầu bằng một câu hỏi hoặc một sự thật bất ngờ.',
  'không thể phủ nhận': '"Không thể phủ nhận" là cách AI hay né tránh lập luận. Hãy đưa ra bằng chứng thay vì khẳng định chung chung.',
  'đóng vai trò quan trọng': '"Đóng vai trò quan trọng" quá mơ hồ. Vai trò cụ thể là gì? Hãy mô tả.',
  'mang lại nhiều lợi ích': '"Mang lại nhiều lợi ích" — lợi ích cụ thể nào? Liệt kê ít nhất 2 lợi ích rõ ràng.',
  'trong bối cảnh': '"Trong bối cảnh" là cụm chuyển đoạn kiểu AI. Hãy dùng chuyển đoạn tự nhiên hơn.',
};

export default function EssayWorkspace({
  selectedPrompt,
  onComplete,
}: {
  selectedPrompt: Prompt;
  onComplete: (result: EssayResult) => void;
}) {
  const { profile } = useAuth();
  const [prompt, setPrompt] = useState<Prompt>(selectedPrompt);
  const [showPromptSwitcher, setShowPromptSwitcher] = useState(false);
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(ESSAY_DURATION);
  const [isActive, setIsActive] = useState(true);

  // Telemetry (collected silently, NOT displayed as live metrics)
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [tabViolations, setTabViolations] = useState(0);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');

  // Socratic
  const [socraticMsgs, setSocraticMsgs] = useState<
    { id: number; text: string }[]
  >([]);
  const socraticIdRef = useRef(0);

  // Anti-spam shake + toast
  const [shake, setShake] = useState(false);
  const [spamToast, setSpamToast] = useState<string | null>(null);

  const textRef = useRef('');
  const startTimeRef = useRef(Date.now());
  const idleRef = useRef(0);
  const lastKeyRef = useRef(Date.now());

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Countdown timer + idle detection
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinish(true);
          return 0;
        }
        return prev - 1;
      });

      const now = Date.now();
      const idleFor = Math.floor((now - lastKeyRef.current) / 1000);
      if (idleFor > 2 && isActive) {
        idleRef.current += 1;
        setIdleSeconds(idleRef.current);

        if (idleFor > IDLE_THRESHOLD && idleFor % IDLE_THRESHOLD === 0) {
          const templates = detectTemplates(textRef.current);
          let msg = SOCRATIC_PROMPTS[Math.floor(Math.random() * SOCRATIC_PROMPTS.length)];
          if (templates.length > 0) {
            const lastTemplate = templates[templates.length - 1];
            const challenge = TEMPLATE_CHALLENGES[lastTemplate.phrase];
            if (challenge) msg = challenge;
          }
          socraticIdRef.current += 1;
          setSocraticMsgs((prev) => [
            ...prev.slice(-3),
            { id: socraticIdRef.current, text: msg },
          ]);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Anti-cheat: tab switch / focus loss
  useEffect(() => {
    const handleBlur = () => {
      setTabViolations((v) => v + 1);
      setShowWarning(true);
      setWarningMsg('Phát hiện chuyển tab / mất focus! Vi phạm đã được ghi nhận.');
      setIsActive(false);
    };
    const handleFocus = () => {
      setShowWarning(false);
      setIsActive(true);
      lastKeyRef.current = Date.now();
    };
    const handleVisibility = () => {
      if (document.hidden) {
        setTabViolations((v) => v + 1);
        setShowWarning(true);
        setWarningMsg('Cửa sổ bị ẩn! Mọi vi phạm được ghi vào dữ liệu nghiên cứu.');
        setIsActive(false);
      } else {
        setShowWarning(false);
        setIsActive(true);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Anti-cheat: disable copy/paste/context menu
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setShowWarning(true);
      setWarningMsg('Sao chép bị khoá trong phòng thí nghiệm!');
      setTimeout(() => setShowWarning(false), 2000);
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setShowWarning(true);
      setWarningMsg('Dán văn bản bị khoá trong phòng thí nghiệm!');
      setTimeout(() => setShowWarning(false), 2000);
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') e.preventDefault();
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    lastKeyRef.current = Date.now();

    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace') {
      setBackspaceCount((c) => c + 1);
    }
  };

  // Telemetry computed ONLY on submit — no live metric display during drafting
  const computeTelemetry = useCallback((): Telemetry => {
    const wc = wordCount(textRef.current);
    const durationSec = Math.min(
      Math.floor((Date.now() - startTimeRef.current) / 1000),
      ESSAY_DURATION,
    );
    const wpm = durationSec > 0 ? Math.round((wc / durationSec) * 60) : 0;
    return {
      wordCount: wc,
      charCount: textRef.current.length,
      wpm,
      backspaceCount,
      tabViolations,
      idleSeconds: idleRef.current,
      durationSeconds: durationSec,
    };
  }, [backspaceCount, tabViolations]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleFinish = (_timedOut = false) => {
    const telemetry = computeTelemetry();
    const {
      scores, vocab, overall, badges,
      isSpam, isViolation, violationReason, rankPoints, feedback,
    } = calculateScores(textRef.current, telemetry);

    // Anti-spam: shake + toast, but still pass result to dashboard
    if (isSpam || isViolation) {
      triggerShake();
      const toastMsg = isViolation
        ? 'Vi phạm luật chơi! Bài viết bị khoá.'
        : 'Định lừa AI à? Viết lại đi fen ơi, viết gì mà ngắn thế!';
      setSpamToast(toastMsg);
      setTimeout(() => setSpamToast(null), 4000);
    }

    const result: EssayResult = {
      text: textRef.current,
      telemetry,
      vocab,
      scores,
      overall,
      badges,
      isSpam,
      isViolation,
      violationReason,
      rankPoints,
      feedback,
    };
    onComplete(result);
  };

  const handleSubmit = () => {
    handleFinish(false);
  };

  const handleSwitchPrompt = (newPrompt: Prompt) => {
    setPrompt(newPrompt);
    setText('');
    setBackspaceCount(0);
    setTabViolations(0);
    setIdleSeconds(0);
    idleRef.current = 0;
    setSocraticMsgs([]);
    setTimeLeft(ESSAY_DURATION);
    startTimeRef.current = Date.now();
    lastKeyRef.current = Date.now();
    setShowPromptSwitcher(false);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Only show word count during drafting — all other metrics frozen until submit
  const wc = wordCount(text);
  const repeatedWords = findRepeatedWords(text, 3);
  const lowTime = timeLeft <= 120;

  const watermarkText = `${profile?.username || 'user'} · ${new Date().toLocaleDateString('vi-VN')}`;

  return (
    <div
      className="min-h-screen select-none pt-20 pb-8"
      onContextMenu={(e) => e.preventDefault()}
      style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 200px, rgba(148,163,184,0.03) 200px, rgba(148,163,184,0.03) 400px)`,
      }}
    >
      {/* Dynamic watermark overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-30 flex flex-wrap items-center justify-center gap-x-16 gap-y-16 overflow-hidden opacity-[0.04] dark:opacity-[0.06]"
        aria-hidden="true"
      >
        {Array.from({ length: 30 }, (_, i) => (
          <span
            key={i}
            className="text-sm font-bold text-slate-800 dark:text-slate-200"
            style={{ transform: `rotate(${i % 2 === 0 ? -15 : 15}deg)` }}
          >
            {watermarkText}
          </span>
        ))}
      </div>

      {/* Tab switch warning overlay */}
      {showWarning && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-red-950/80 backdrop-blur-md animate-fade-in">
          <div className="rounded-2xl bg-white p-8 text-center shadow-2xl animate-scale-in dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
              <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-red-600 dark:text-red-400">
              CẢNH BÁO BẢO MẬT
            </h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              {warningMsg}
            </p>
            <p className="text-xs text-slate-400">
              Tổng số vi phạm: <strong className="text-red-500">{tabViolations}</strong>
            </p>
            <Button
              className="mt-5"
              onClick={() => {
                setShowWarning(false);
                setIsActive(true);
                lastKeyRef.current = Date.now();
              }}
            >
              Tôi hiểu — Tiếp tục làm bài
            </Button>
          </div>
        </div>
      )}

      {/* Anti-spam toast */}
      {spamToast && (
        <div className="fixed top-24 left-1/2 z-[80] -translate-x-1/2 animate-fade-in-up">
          <div className="flex items-center gap-3 rounded-2xl bg-red-600 px-6 py-4 text-white shadow-2xl">
            <Flame className="h-5 w-5 shrink-0" />
            <span className="text-sm font-bold">{spamToast}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Prompt display + switcher */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">
              Đề bài nghị luận
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
              {prompt.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
                lowTime
                  ? 'animate-pulse bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                  : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
              }`}
            >
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowPromptSwitcher(true)}
              className="!px-3 !py-1.5 !text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Chuyển đề
            </Button>
          </div>
        </div>

        {/* Minimal drafting info — only word count, everything else frozen */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-sm backdrop-blur-md dark:bg-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
            <Type className="h-3.5 w-3.5" />
            Số từ
          </div>
          <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{wc}</span>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Activity className="h-3.5 w-3.5" />
            <span>Telemetry khoá — chấm điểm khi nộp bài</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          {/* Editor */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              placeholder="Viết tự do — không ai phán xét bạn lúc đang viết. Mọi chấm điểm chỉ xảy ra khi bạn nhấn nộp."
              className="h-[420px] w-full resize-none rounded-2xl border border-slate-200 bg-white/90 p-5 text-sm leading-relaxed text-slate-800 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
              style={{ userSelect: 'text' }}
            />
            {/* Semantic drift visualizer hint */}
            {repeatedWords.size > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50/80 p-3 text-xs dark:bg-amber-900/20">
                <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                  <Eye className="h-3.5 w-3.5" />
                  Từ lặp nhiều:
                </span>
                {Array.from(repeatedWords.entries()).map(([word, count]) => (
                  <span
                    key={word}
                    className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 opacity-60 dark:bg-amber-900/40 dark:text-amber-400"
                  >
                    {word} ({count})
                  </span>
                ))}
                <span className="text-amber-600/70 dark:text-amber-400/70">
                  — thử thay bằng từ đồng nghĩa sâu hơn
                </span>
              </div>
            )}
            {/* AI template detection warning */}
            {detectTemplates(text).length > 0 && text.length > 20 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-red-50/80 p-3 text-xs dark:bg-red-900/20">
                <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Phát hiện cụm từ mẫu AI:
                </span>
                {detectTemplates(text).slice(0, 4).map((t, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-600 line-through dark:bg-red-900/40 dark:text-red-400"
                  >
                    {t.phrase}
                  </span>
                ))}
                <span className="text-red-500/70 dark:text-red-400/70">
                  — thử diễn đạt lại bằng giọng văn của bạn
                </span>
              </div>
            )}
          </div>

          {/* Socratic dialogue stream */}
          <div className="flex h-[420px] flex-col rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md dark:bg-slate-800/60">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Socratic AI
                </p>
                <p className="text-xs text-slate-400">Gợi mở tư duy</p>
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {socraticMsgs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Sparkles className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Trợ lý sẽ gợi ý câu hỏi khi bạn ngưng viết quá 12 giây.
                  </p>
                </div>
              ) : (
                socraticMsgs.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl rounded-bl-sm bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-slate-700 animate-fade-in-up dark:bg-brand-900/30 dark:text-slate-200"
                  >
                    {m.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Submit button — with anti-spam shake */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:from-brand-700 hover:to-brand-800 hover:shadow-xl ${
              shake ? 'animate-shake' : ''
            }`}
          >
            <Send className="h-4 w-4" />
            Nộp bài / Flex kết quả
          </button>
        </div>
      </div>

      {/* Prompt switcher modal */}
      {showPromptSwitcher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowPromptSwitcher(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Chuyển đề bài
              </h3>
              <button
                onClick={() => setShowPromptSwitcher(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              Chuyển đề sẽ xoá bài viết hiện tại và đặt lại đồng hồ về 15:00.
            </p>
            <div className="space-y-2">
              {PROMPTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSwitchPrompt(p)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm transition ${
                    p.id === prompt.id
                      ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-700">
                    {p.id}
                  </span>
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

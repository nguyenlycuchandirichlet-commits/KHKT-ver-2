import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import { Flame, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { wordCount } from '@/lib/scoring';

const SPEED_DURATION = 5 * 60;

const SPEED_PROMPTS = [
  'AI đang làm con người lười suy nghĩ hay thông minh hơn? Phản biện trong 5 phút — không sửa, không xoá.',
  'Nếu cấm hoàn toàn AI trong giáo dục, điều gì sẽ xảy ra? Viết liên tục, không dừng.',
  'Sự khác nhau giữa "dùng AI như công cụ" và "để AI thay nghĩ" là gì? Viết dòng suy nghĩ liên tục.',
];

export default function SpeedRebuttalStation({
  onComplete,
}: {
  onComplete: (wordCount: number, wpm: number) => void;
}) {
  const [promptIdx] = useState(() => Math.floor(Math.random() * SPEED_PROMPTS.length));
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(SPEED_DURATION);
  const [isActive, setIsActive] = useState(true);
  const [finished, setFinished] = useState(false);
  const [finalWc, setFinalWc] = useState(0);
  const [finalWpm, setFinalWpm] = useState(0);
  const startTimeRef = useRef(Date.now());
  const textRef = useRef('');

  useEffect(() => {
    textRef.current = text;
  }, [text]);

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
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinish = useCallback((timedOut: boolean) => {
    const wc = wordCount(textRef.current);
    const durationSec = Math.min(
      Math.floor((Date.now() - startTimeRef.current) / 1000),
      SPEED_DURATION,
    );
    const wpm = durationSec > 0 ? Math.round((wc / durationSec) * 60) : 0;
    setFinalWc(wc);
    setFinalWpm(wpm);
    setFinished(true);
    if (timedOut || wc >= 30) {
      onComplete(wc, wpm);
    }
  }, [onComplete]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fuseWidth = (timeLeft / SPEED_DURATION) * 100;
  const wc = wordCount(text);
  const lowTime = timeLeft <= 60;

  if (finished) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-emerald-50 p-6 text-center dark:bg-emerald-900/20">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            Phản biện tốc độ hoàn thành!
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white p-4 dark:bg-slate-800">
              <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">{finalWc}</p>
              <p className="text-xs text-slate-400">Từ viết</p>
            </div>
            <div className="rounded-xl bg-white p-4 dark:bg-slate-800">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{finalWpm}</p>
              <p className="text-xs text-slate-400">Từ/phút</p>
            </div>
          </div>
          {finalWc < 30 && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              Bài quá ngắn — cần ít nhất 30 từ để ghi nhận. Hãy viết lại nếu muốn hoàn thành chặng.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Burning fuse timer */}
      <div className="rounded-xl bg-slate-900 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={`h-5 w-5 ${lowTime ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} />
            <span className={`text-sm font-bold ${lowTime ? 'text-red-400' : 'text-orange-300'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {wc} từ · {lowTime ? 'CẢNH BÁO: Sắp hết giờ!' : 'Duy trì dòng suy nghĩ'}
          </span>
        </div>
        {/* Visual burning fuse */}
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              lowTime
                ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse'
                : 'bg-gradient-to-r from-orange-500 to-amber-400'
            }`}
            style={{ width: `${fuseWidth}%` }}
          />
          {/* Spark at the burning edge */}
          <div
            className="absolute top-0 h-3 w-2 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)]"
            style={{ left: `calc(${fuseWidth}% - 4px)` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-xl bg-orange-50 p-4 dark:bg-orange-900/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
          Đề phản biện tốc độ
        </p>
        <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
          {SPEED_PROMPTS[promptIdx]}
        </p>
      </div>

      {/* Stream of consciousness editor */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Viết liên tục — không sửa, không xoá, không dừng. Dòng suy nghĩ chảy như dung nham..."
        className="h-64 w-full resize-none rounded-xl border-2 border-orange-200 bg-white p-4 text-sm leading-relaxed outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        autoFocus
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <AlertCircle className="h-3.5 w-3.5" />
          Không chỉnh sửa — cứ viết tiếp. Chỉ nộp khi hết giờ hoặc viết đủ 30+ từ.
        </div>
        <Button
          onClick={() => handleFinish(false)}
          disabled={wc < 30}
          className="!py-2"
        >
          <Send className="h-4 w-4" />
          Nộp phản biện
        </Button>
      </div>
    </div>
  );
}

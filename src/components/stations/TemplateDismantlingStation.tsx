import { useState } from 'react';
import { Button } from '@/components/ui';
import {
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Sparkles,
} from 'lucide-react';
import { detectTemplates, wordCount } from '@/lib/scoring';

const TEMPLATE_SENTENCES = [
  {
    text: 'Trong thời đại ngày nay, AI đóng vai trò quan trọng và mang lại nhiều lợi ích cho học sinh.',
    templates: ['trong thời đại ngày nay', 'đóng vai trò quan trọng', 'mang lại nhiều lợi ích'],
  },
  {
    text: 'Như chúng ta đã biết, không thể phủ nhận rằng AI đang thay đổi xã hội hiện đại một cách sâu sắc.',
    templates: ['như chúng ta đã biết', 'không thể phủ nhận', 'xã hội hiện đại'],
  },
  {
    text: 'Trong bối cảnh 4.0, công nghệ tự động hóa tạo điều kiện cho con người phát triển.',
    templates: ['trong bối cảnh', 'tự động hóa', 'tạo điều kiện cho'],
  },
];

const PERSONALIZATION_HINTS: Record<string, string> = {
  'trong thời đại ngày nay': 'Thay bằng quan sát cụ thể: "Từ khi ChatGPT ra mắt năm 2023..."',
  'đóng vai trò quan trọng': 'Thay bằng mô tả cụ thể: "quyết định điểm số thay vì chỉ hỗ trợ..."',
  'mang lại nhiều lợi ích': 'Thay bằng liệt kê: "giúp tóm tắt nhanh, nhưng làm teo khả năng viết"',
  'như chúng ta đã biết': 'Bỏ hẳn — bắt đầu bằng một câu hỏi hoặc sự thật bất ngờ',
  'không thể phủ nhận': 'Thay bằng bằng chứng: "3/5 bài tập tôi nộp đều dùng AI..."',
  'xã hội hiện đại': 'Thay bằng bối cảnh cụ thể: "trong lớp 12A1 tuần trước..."',
  'trong bối cảnh': 'Thay bằng chuyển đoạn tự nhiên: "Nhưng thực tế là..."',
  'tự động hóa': 'Thay bằng ví dụ cụ thể: "ChatGPT viết thay tôi..."',
  'tạo điều kiện cho': 'Thay bằng mô tả trực tiếp: "khiến tôi lười suy nghĩ hơn..."',
};

export default function TemplateDismantlingStation({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const [originalText, setOriginalText] = useState(TEMPLATE_SENTENCES[0].text);
  const [rewrittenText, setRewrittenText] = useState('');
  const [completed, setCompleted] = useState<boolean[]>([false, false, false]);

  const currentTemplates = TEMPLATE_SENTENCES[step].templates;
  const detectedInRewrite = detectTemplates(rewrittenText);
  const allReplaced = currentTemplates.every(
    (t) => !rewrittenText.toLowerCase().includes(t),
  );
  const wc = wordCount(rewrittenText);
  const canAdvance = allReplaced && wc >= 15;

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
      setOriginalText(TEMPLATE_SENTENCES[step + 1].text);
      setRewrittenText('');
    } else {
      onComplete();
    }
  };

  const handleReplace = () => {
    const newCompleted = [...completed];
    newCompleted[step] = true;
    setCompleted(newCompleted);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-orange-50 p-4 dark:bg-orange-900/20">
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-500" />
          <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
            Trạm tháo mẫu AI · Bước {step + 1}/3
          </p>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Phát hiện cụm từ mẫu AI và thay bằng giọng văn cá nhân. Mỗi cụm phải được diễn đạt lại.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-2 w-8 rounded-full transition ${
              completed[i]
                ? 'bg-emerald-500'
                : i === step
                  ? 'bg-orange-400'
                  : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Original text with highlighted templates */}
      <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4 dark:border-red-800/50 dark:bg-red-900/10">
        <p className="mb-2 text-xs font-semibold text-red-600 dark:text-red-400">
          Văn mẫu AI — phát hiện cụm sáo rỗng:
        </p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {originalText.split(/(\s+)/).map((word, i) => {
            const lower = word.toLowerCase().replace(/[.,!?;:]/g, '');
            const isTemplate = currentTemplates.some((t) =>
              lower.length > 3 && t.includes(lower),
            );
            return (
              <span
                key={i}
                className={
                  isTemplate
                    ? 'rounded bg-red-200/60 px-0.5 font-medium text-red-700 line-through dark:bg-red-900/40 dark:text-red-400'
                    : ''
                }
              >
                {word}
              </span>
            );
          })}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {currentTemplates.map((t) => (
            <span
              key={t}
              className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Rewrite area */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Viết lại bằng giọng văn của bạn:
        </p>
        <textarea
          value={rewrittenText}
          onChange={(e) => setRewrittenText(e.target.value)}
          placeholder="Diễn đạt lại ý trên bằng trải nghiệm/góc nhìn cá nhân..."
          className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{wc} từ · cần ít nhất 15</span>
          {detectedInRewrite.length > 0 ? (
            <span className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-3 w-3" />
              Vẫn còn {detectedInRewrite.length} cụm mẫu AI
            </span>
          ) : wc >= 15 ? (
            <span className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="h-3 w-3" />
              Đã thay hết — cá nhân hoá thành công
            </span>
          ) : null}
        </div>
      </div>

      {/* Personalization hints */}
      {currentTemplates.map((t) => (
        <div key={t} className="rounded-lg bg-amber-50/80 p-2.5 text-xs dark:bg-amber-900/20">
          <p className="font-semibold text-amber-700 dark:text-amber-400">"{t}"</p>
          <p className="mt-0.5 text-slate-600 dark:text-slate-300">
            {PERSONALIZATION_HINTS[t] || 'Hãy thay bằng diễn đạt cá nhân cụ thể.'}
          </p>
        </div>
      ))}

      {/* Side-by-side comparison */}
      {canAdvance && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800/50 dark:bg-emerald-900/10">
          <div>
            <p className="mb-1 text-xs font-bold text-red-500">Trước (AI mẫu)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">{originalText}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-emerald-500">Sau (Cá nhân hoá)</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">{rewrittenText}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {canAdvance && !completed[step] && (
          <Button variant="secondary" onClick={handleReplace} className="!py-2 !text-xs">
            <CheckCircle2 className="h-4 w-4" />
            Xác nhận bước {step + 1}
          </Button>
        )}
        {completed[step] && (
          <Button onClick={handleNext} className="!py-2">
            {step < 2 ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Câu tiếp theo
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Hoàn thành trạm tháo mẫu
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

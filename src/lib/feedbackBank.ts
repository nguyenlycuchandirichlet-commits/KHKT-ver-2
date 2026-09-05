import type { Scores, Telemetry, VocabStats, FeedbackCard } from './scoring';
import {
  FRAMES,
  extractQuotes,
  fill,
  seededHash,
  selectTier,
  generateFrame,
  type FeedbackContext,
  type Tier,
} from './roadmapFeedback';

export type ErrorSignature = {
  lowVocabDiversity: boolean;
  highRepetition: boolean;
  pacingTooFast: boolean;
  pacingTooSlow: boolean;
  highCliche: boolean;
  highIdle: boolean;
  tabViolation: boolean;
  lowWordCount: boolean;
  highBackspace: boolean;
};

function buildContext(
  text: string,
  scores: Scores,
  vocab: VocabStats,
  telemetry: Telemetry,
  overall: number,
  findRepeatedWords: (text: string, threshold?: number) => Map<string, number>,
): FeedbackContext {
  const wc = telemetry.wordCount;
  const repeated = findRepeatedWords(text, 3);
  const topRepeats = Array.from(repeated.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);

  const uniqueRatio = vocab.total > 0 ? vocab.unique / vocab.total : 0;
  const criticalRatio = vocab.total > 0 ? vocab.critical / vocab.total : 0;

  const logicIndex = Math.round(
    Math.min(
      (scores.depth / 100) * 2 +
        (criticalRatio * 200) +
        (vocab.clicheHits === 0 ? 0.5 : 0) +
        (wc >= 200 ? 0.5 : 0),
      5,
    ),
  );

  return {
    score: overall,
    logicIndex,
    uniqueWords: vocab.unique,
    totalWords: vocab.total,
    wpm: telemetry.wpm,
    debateRounds: 0,
    fallacyCount: 0,
    repetitionCount: repeated.size,
    clicheCount: vocab.clicheHits,
    idleSeconds: telemetry.idleSeconds,
    tabViolations: telemetry.tabViolations,
    userId: 'essay',
    timestamp: Date.now(),
    rawText: text,
  };
}

function getTone(tier: Tier): 'roast' | 'praise' | 'mixed' {
  if (tier === 'weak') return 'roast';
  if (tier === 'good') return 'praise';
  return 'mixed';
}

function injectErrors(base: string, ctx: FeedbackContext, text: string, vocab: VocabStats, telemetry: Telemetry, findRepeatedWords: (text: string, threshold?: number) => Map<string, number>): string {
  let result = base;

  const wc = telemetry.wordCount;
  const repeated = findRepeatedWords(text, 3);
  const topRepeats = Array.from(repeated.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([w]) => w);

  const injections: string[] = [];
  if (repeated.size >= 4 && topRepeats.length > 0) {
    const reps = topRepeats.slice(0, 2).map(w => `"${w}"`).join(', ');
    injections.push(`Lặp từ rõ rệt ở ${reps} — cần thay bằng từ đồng nghĩa để tránh trùng lặp.`);
  }
  if (vocab.clicheHits >= 3) {
    injections.push(`Phát hiện ${vocab.clicheHits} cụm sáo rỗng kiểu "đóng vai trò quan trọng" — nên loại bỏ để bài viết có sức nặng riêng.`);
  }
  if (telemetry.wpm > 0 && telemetry.wpm < 8) {
    injections.push(`Tốc độ ${telemetry.wpm} từ/phút khá chậm — cần rèn phản xạ viết nhanh hơn để giữ mạch suy nghĩ.`);
  }
  if (telemetry.wpm > 45) {
    injections.push(`Tốc độ ${telemetry.wpm} từ/phút hơi nhanh — cần chậm lại để sắp xếp ý tứ kỹ hơn.`);
  }
  if (telemetry.idleSeconds > 60) {
    injections.push(`Thời gian ngưng gõ ${telemetry.idleSeconds} giây — khi bí ý, hãy viết đại bất cứ điều gì rồi chỉnh sau, đừng để dòng suy nghĩ bị đứt.`);
  }
  if (telemetry.tabViolations > 0) {
    injections.push(`Có ${telemetry.tabViolations} lần chuyển tab — nên tập viết tự lực, không dựa vào nguồn trợ giúp ngoài.`);
  }
  if (vocab.total > 0 && vocab.unique / vocab.total < 0.45) {
    injections.push(`Tỷ lệ từ độc nhất ${vocab.unique}/${vocab.total} còn thấp — cần mở rộng vốn từ để bài viết phong phú hơn.`);
  }
  if (wc > 0 && telemetry.backspaceCount / wc > 0.3) {
    injections.push(`Tỷ lệ xoá cao — cần lên dàn ý trước khi viết để giảm việc sửa liên tục.`);
  }

  if (injections.length > 0) {
    const picked = injections.slice(0, 2).join(' ');
    result = result.replace(/\s*$/, '') + ' ' + picked;
  }

  return result;
}

export function generateVariantFeedback(
  text: string,
  scores: Scores,
  vocab: VocabStats,
  telemetry: Telemetry,
  overall: number,
  findRepeatedWords: (text: string, threshold?: number) => Map<string, number>,
): FeedbackCard[] {
  const ctx = buildContext(text, scores, vocab, telemetry, overall, findRepeatedWords);
  const quotes = extractQuotes(text);
  const tier = selectTier(overall);
  const tone = getTone(tier);

  const seed = Math.floor(ctx.timestamp / 1000) ^ (overall * 31) ^ (wc_hash(text) * 7919);

  const depth = generateFrame(FRAMES[0], ctx, quotes, tier, seed);
  const vocabFeedback = generateFrame(FRAMES[1], ctx, quotes, tier, seed + 101);
  const advice = generateFrame(FRAMES[2], ctx, quotes, tier, seed + 202);

  return [
    {
      title: 'Phân tích Nội dung & Lập luận',
      icon: '🔥',
      body: injectErrors(depth, ctx, text, vocab, telemetry, findRepeatedWords),
      tone,
    },
    {
      title: 'Khả năng diễn đạt & Từ vựng',
      icon: '💎',
      body: injectErrors(vocabFeedback, ctx, text, vocab, telemetry, findRepeatedWords),
      tone,
    },
    {
      title: 'Tính sáng tạo & Lời khuyên',
      icon: '🌋',
      body: injectErrors(advice, ctx, text, vocab, telemetry, findRepeatedWords),
      tone,
    },
  ];
}

function wc_hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export { FeedbackCard };

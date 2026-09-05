export type Telemetry = {
  wordCount: number;
  charCount: number;
  wpm: number;
  backspaceCount: number;
  tabViolations: number;
  idleSeconds: number;
  durationSeconds: number;
};

export type VocabStats = {
  common: number;
  critical: number;
  unique: number;
  total: number;
  clicheHits: number;
};

export type Scores = {
  depth: number;
  fluency: number;
  independence: number;
  vocabularyCoherence: number;
  speed: number;
};

export type FeedbackCard = {
  title: string;
  icon: string;
  body: string;
  tone: 'roast' | 'praise' | 'mixed';
};

export type EssayResult = {
  text: string;
  telemetry: Telemetry;
  vocab: VocabStats;
  scores: Scores;
  overall: number;
  badges: Badge[];
  isSpam: boolean;
  isViolation: boolean;
  violationReason: string;
  rankPoints: number;
  feedback: FeedbackCard[];
};

export type Badge = {
  id: string;
  label: string;
  emoji: string;
  desc: string;
};

export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Master';

const AI_TEMPLATE_PHRASES = [
  'trong thời đại ngày nay',
  'trong xã hội hiện đại',
  'như chúng ta đã biết',
  'nói chung',
  'tóm lại',
  'điều này cho thấy',
  'từ xưa đến nay',
  'thời đại 4.0',
  'đón đầu xu thế',
  'nhìn chung',
  'tự động hóa',
  'nói tóm lại',
  'có thể nói rằng',
  'không thể phủ nhận',
  'đóng vai trò quan trọng',
  'một mặt nào đó',
  'với sự phát triển của',
  'trong bối cảnh',
  'tạo điều kiện cho',
  'mang lại nhiều lợi ích',
  'mặt trái của',
  'nhìn nhận một cách khách quan',
];

const TOXIC_PATTERNS = [
  'địt',
  'lồn',
  'cặc',
  'buồi',
  'mẹ mày',
  'thằng chó',
  'con chó',
  'mày là',
  'đồ ngu',
  'đồ điên',
  'óc chó',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'địt mẹ',
  'vãi đái',
  'cái lồn',
  'thằng lồn',
  'con lồn',
];

const SPAM_PATTERNS = [
  'không biết làm',
  'không biết viết',
  'không biết',
  'em không biết',
  'chưa biết',
  'khó quá',
  'làm không được',
  'không hiểu',
  'em không hiểu',
  'không có ý kiến',
  'k có ý kiến',
  'không nghĩ ra',
  'biết gì đâu',
  'viết gì bây giờ',
  'không nghĩ được',
  'hổng biết',
  'kg biết',
  'k biết',
];

export const RANK_TIERS: { tier: RankTier; min: number; color: string; label: string; slang: string; emoji: string }[] = [
  { tier: 'Bronze', min: 0, color: 'from-amber-700 to-amber-900', label: 'Đồng', slang: 'Khởi đầu hành trình', emoji: '🌋' },
  { tier: 'Silver', min: 200, color: 'from-slate-400 to-slate-600', label: 'Bạc', slang: 'Đang trổ tài phản biện', emoji: '🪨' },
  { tier: 'Gold', min: 500, color: 'from-yellow-400 to-amber-600', label: 'Vàng', slang: 'Lập luận sắc bén', emoji: '🔥' },
  { tier: 'Diamond', min: 1000, color: 'from-cyan-400 to-blue-600', label: 'Kim Cương', slang: 'Văn phong xuất chúng', emoji: '💎' },
  { tier: 'Master', min: 2000, color: 'from-fuchsia-500 to-purple-700', label: 'Master Challenger', slang: 'Bậc thầy tư duy phản biện', emoji: '👑' },
];

export function getRankTier(points: number): typeof RANK_TIERS[0] {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (points >= RANK_TIERS[i].min) return RANK_TIERS[i];
  }
  return RANK_TIERS[0];
}

export function getRankPoints(overall: number, _scores?: Scores, _telemetry?: Telemetry): number {
  if (overall >= 80) return 50;
  if (overall >= 50) return 25;
  if (overall >= 30) return 15;
  return 0;
}

// --- Anti-spam detection ---

export function isSpamSubmission(text: string): { spam: boolean; reason: string } {
  const trimmed = text.trim();
  const wc = wordCount(trimmed);

  if (wc < 30) {
    return { spam: true, reason: `Bài viết quá ngắn (${wc} từ — cần ít nhất 30 từ).` };
  }

  const lower = trimmed.toLowerCase();
  for (const pattern of SPAM_PATTERNS) {
    if (lower.includes(pattern) && wc < 60) {
      return { spam: true, reason: `Nội dung lười biếng/phát hiện né tránh: "${pattern}".` };
    }
  }

  // Check if text is just repeated characters
  const uniqueChars = new Set(trimmed.replace(/\s/g, '').split('')).size;
  if (wc >= 30 && uniqueChars < 8) {
    return { spam: true, reason: 'Nội dung lặp ký tự — không có tư duy thực sự.' };
  }

  return { spam: false, reason: '' };
}

// --- Toxic moderation ---

export function isToxicContent(text: string): { toxic: boolean; reason: string } {
  const lower = text.toLowerCase();
  for (const pattern of TOXIC_PATTERNS) {
    if (lower.includes(pattern)) {
      return { toxic: true, reason: `Nội dung vi phạm: phát hiện từ ngữ không phù hợp.` };
    }
  }
  return { toxic: false, reason: '' };
}

// --- Badges ---

export function computeBadges(
  scores: Scores,
  telemetry: Telemetry,
  vocab: VocabStats,
  text: string,
): Badge[] {
  const badges: Badge[] = [];

  if (telemetry.tabViolations === 0 && telemetry.wordCount > 100) {
    badges.push({
      id: 'self-reliant',
      label: 'Bản lĩnh tự lực',
      emoji: '🛡️',
      desc: 'Không một lần chuyển tab trong suốt phiên làm bài',
    });
  }

  if (vocab.critical >= 8) {
    badges.push({
      id: 'vocab-master',
      label: 'Bậc thầy từ vựng phản biện',
      emoji: '💎',
      desc: `Sử dụng ${vocab.critical} từ vựng phản biện và học thuật`,
    });
  }

  const repeatedCount = findRepeatedWords(text, 3).size;
  if (repeatedCount >= 5) {
    badges.push({
      id: 'repeat-fan',
      label: 'Lặp từ trầm trọng',
      emoji: '🔄',
      desc: `${repeatedCount} từ bị lặp nhiều lần — cần mở rộng vốn từ`,
    });
  }

  if (scores.depth >= 80) {
    badges.push({
      id: 'deep-thinker',
      label: 'Tư duy sâu sắc',
      emoji: '🌋',
      desc: 'Điểm chiều sâu tư duy đạt từ 80 trở lên',
    });
  }

  if (telemetry.wpm >= 25 && telemetry.wpm <= 35 && telemetry.wordCount > 150) {
    badges.push({
      id: 'flow-state',
      label: 'Nhịp viết ổn định',
      emoji: '🌊',
      desc: 'Tốc độ viết đều đặn, không quá nhanh cũng không quá chậm',
    });
  }

  if (telemetry.idleSeconds > 60 && scores.independence < 50) {
    badges.push({
      id: 'paralysis',
      label: 'Tê liệt biểu đạt',
      emoji: '💤',
      desc: `${telemetry.idleSeconds} giây ngưng gõ — cần rèn luyện phản xạ viết`,
    });
  }

  if (vocab.clicheHits >= 3) {
    badges.push({
      id: 'cliche-king',
      label: 'Văn sáo rỗng',
      emoji: '👑',
      desc: `${vocab.clicheHits} cụm từ sáo rỗng hoặc khuôn mẫu được phát hiện`,
    });
  }

  if (telemetry.wordCount >= 300) {
    badges.push({
      id: 'marathon',
      label: 'Bền bỉ suốt phiên',
      emoji: '🏃',
      desc: `Viết ${telemetry.wordCount} từ — duy trì sự tập trung lâu dài`,
    });
  }

  if (scores.depth + scores.fluency + scores.independence + scores.vocabularyCoherence + scores.speed >= 85 * 5) {
    badges.push({
      id: 'champion',
      label: 'Xuất sắc toàn diện',
      emoji: '🏆',
      desc: 'Tổng điểm đạt từ 85 trở lên — chất lượng vượt trội',
    });
  }

  return badges;
}

export function detectTemplates(text: string): { phrase: string; start: number }[] {
  const lower = text.toLowerCase();
  const found: { phrase: string; start: number }[] = [];
  for (const phrase of AI_TEMPLATE_PHRASES) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      found.push({ phrase, start: idx });
    }
  }
  return found;
}

const COMMON_WORDS = new Set([
  'như', 'của', 'và', 'là', 'cho', 'một', 'có', 'không', 'đó', 'này',
  'với', 'được', 'trong', 'khi', 'các', 'người', 'để', 'cũng', 'sẽ', 'theo',
  'từ', 'rất', 'nhiều', 'làm', 'nên', 'về', 'mà', 'cho', 'thì', 'đã',
  'cũng', 'những', 'gì', 'ai', 'đi', 'lên', 'xuống', 'vào', 'ra', 'nhiều',
  'tốt', 'xấu', 'hay', 'đẹp', 'to', 'nhỏ', 'cao', 'thấp',
  'thật', 'quá', 'lắm', 'lắm', 'hơn', 'nhất',
]);

const CRITICAL_WORDS = new Set([
  'phản biện', 'nghị luận', 'luận điểm', 'lập luận', 'bằng chứng',
  'giả định', 'suy luận', 'phân tích', 'tổng hợp', 'đánh giá',
  'chứng minh', 'bác bỏ', 'hệ quả', 'nguyên nhân', 'tương quan',
  'mâu thuẫn', 'thuyết phục', 'định nghĩa', 'khái niệm', 'tiêu chí',
  'trực giác', 'logic', 'suy nghĩ', 'nhận thức', 'biểu đạt',
  'sáng tạo', 'độc lập', 'chủ động', 'phong phú', 'sâu sắc',
  'đa chiều', 'toàn diện', 'khách quan', 'chủ quan', 'thực chứng',
  'thuật toán', 'trí tuệ', 'nhân tạo', 'ngữ nghĩa', 'biến đổi',
  'tư duy', 'phức tạp', 'tri thức', 'hệ thống', 'quy trình',
  'tiền đề', 'kết luận', 'lập trường', 'góc nhìn', 'tranh luận',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function countCliches(text: string): number {
  const lower = text.toLowerCase();
  return AI_TEMPLATE_PHRASES.reduce(
    (count, phrase) => count + (lower.includes(phrase) ? 1 : 0),
    0,
  );
}

export function analyzeVocabulary(text: string): VocabStats {
  const words = tokenize(text);
  const uniqueWords = new Set(words);
  let common = 0;
  let critical = 0;

  for (const w of words) {
    if (COMMON_WORDS.has(w)) common++;
  }
  const lowerText = text.toLowerCase();
  for (const cw of CRITICAL_WORDS) {
    let idx = lowerText.indexOf(cw);
    while (idx !== -1) {
      critical++;
      idx = lowerText.indexOf(cw, idx + cw.length);
    }
  }

  return {
    common: words.length > 0 ? common : 0,
    critical,
    unique: uniqueWords.size,
    total: words.length,
    clicheHits: countCliches(text),
  };
}

export function wordCount(text: string): number {
  return tokenize(text).length;
}

// --- Feedback generation (delegates to 10-tier variant bank) ---

import { generateVariantFeedback } from './feedbackBank';

export function generateFeedback(
  text: string,
  scores: Scores,
  vocab: VocabStats,
  telemetry: Telemetry,
  isSpam: boolean,
  isViolation: boolean,
  overall?: number,
): FeedbackCard[] {
  if (isViolation) {
    return [
      {
        title: 'Vi phạm quy định',
        icon: '🚫',
        body: 'Bài viết chứa nội dung không phù hợp. Hệ thống đã khoá bản ghi này, không tính điểm và không ghi nhận vào xếp hạng. Vui lòng viết lại bằng ngôn ngữ chuẩn mực.',
        tone: 'roast',
      },
    ];
  }

  if (isSpam) {
    return [
      {
        title: 'Nội dung chưa đạt yêu cầu',
        icon: '⚠️',
        body: 'Bài viết quá ngắn hoặc có dấu hiệu né tránh, chưa thể đánh giá năng lực phản biện. Hãy viết nghiêm túc — tư duy cần được rèn luyện qua từng câu chữ, không thể bỏ qua.',
        tone: 'roast',
      },
    ];
  }

  return generateVariantFeedback(
    text,
    scores,
    vocab,
    telemetry,
    overall ?? 0,
    findRepeatedWords,
  );
}

// --- Main scoring function (post-submission only) ---

export function calculateScores(
  text: string,
  telemetry: Telemetry,
): { scores: Scores; vocab: VocabStats; overall: number; badges: Badge[]; isSpam: boolean; isViolation: boolean; violationReason: string; rankPoints: number; feedback: FeedbackCard[] } {
  const vocab = analyzeVocabulary(text);
  const wc = telemetry.wordCount;

  // Anti-spam + toxic checks
  const spamCheck = isSpamSubmission(text);
  const toxicCheck = isToxicContent(text);

  const isViolation = toxicCheck.toxic;
  const violationReason = toxicCheck.reason;

  // If toxic: suppress all scoring
  if (isViolation) {
    const zeroScores: Scores = { depth: 0, fluency: 0, independence: 0, vocabularyCoherence: 0, speed: 0 };
    return {
      scores: zeroScores,
      vocab,
      overall: 0,
      badges: [],
      isSpam: false,
      isViolation: true,
      violationReason,
      rankPoints: 0,
      feedback: generateFeedback(text, zeroScores, vocab, telemetry, false, true),
    };
  }

  // If spam: force ALL sub-metrics to 0, overall 0/100, 0 rank points
  if (spamCheck.spam) {
    const zeroScores: Scores = { depth: 0, fluency: 0, independence: 0, vocabularyCoherence: 0, speed: 0 };
    return {
      scores: zeroScores,
      vocab,
      overall: 0,
      badges: [],
      isSpam: true,
      isViolation: false,
      violationReason: spamCheck.reason,
      rankPoints: 0,
      feedback: generateFeedback(text, zeroScores, vocab, telemetry, true, false),
    };
  }

  // Normal scoring
  const uniqueRatio = vocab.total > 0 ? vocab.unique / vocab.total : 0;
  const criticalRatio = vocab.total > 0 ? vocab.critical / vocab.total : 0;
  const clichePenalty = Math.min(vocab.clicheHits * 5, 25);

  let depth = 0;
  if (wc >= 50) depth = 30;
  if (wc >= 150) depth += 20;
  if (wc >= 300) depth += 10;
  depth += Math.min(criticalRatio * 200, 25);
  depth += uniqueRatio * 15;
  depth -= clichePenalty;
  depth = Math.max(0, Math.min(100, Math.round(depth)));

  const wpm = telemetry.wpm;
  let wpmScore = 0;
  if (wpm >= 10 && wpm <= 40) wpmScore = 40;
  else if (wpm > 5 && wpm < 50) wpmScore = 25;
  else if (wpm > 0) wpmScore = 15;
  const backspaceRatio = wc > 0 ? telemetry.backspaceCount / wc : 0;
  const backspacePenalty = Math.min(backspaceRatio * 30, 20);
  let fluency = wpmScore + Math.min(wc / 8, 40) - backspacePenalty;
  fluency = Math.max(0, Math.min(100, Math.round(fluency)));

  const tabPenalty = Math.min(telemetry.tabViolations * 12, 40);
  const idleRatio = telemetry.durationSeconds > 0 ? telemetry.idleSeconds / telemetry.durationSeconds : 0;
  const idlePenalty = Math.min(idleRatio * 40, 30);
  let independence = 60 - tabPenalty - idlePenalty;
  if (wc >= 200) independence += 20;
  if (wc >= 400) independence += 10;
  if (telemetry.durationSeconds >= 300) independence += 10;
  independence = Math.max(0, Math.min(100, Math.round(independence)));

  let vocabCoherence = uniqueRatio * 50 + Math.min(criticalRatio * 150, 35);
  vocabCoherence -= clichePenalty;
  if (vocab.unique >= 80) vocabCoherence += 15;
  vocabCoherence = Math.max(0, Math.min(100, Math.round(vocabCoherence)));

  let speed = 0;
  if (wpm > 0) speed = Math.min(wpm * 3, 100);
  if (wc < 30) speed = Math.min(speed, 20);
  speed = Math.max(0, Math.min(100, Math.round(speed)));

  const scores: Scores = {
    depth,
    fluency,
    independence,
    vocabularyCoherence: vocabCoherence,
    speed,
  };

  const overall = Math.round(
    depth * 0.25 +
    fluency * 0.2 +
    independence * 0.2 +
    vocabCoherence * 0.2 +
    speed * 0.15,
  );

  const badges = computeBadges(scores, telemetry, vocab, text);
  const rankPoints = getRankPoints(overall, scores, telemetry);
  const feedback = generateFeedback(text, scores, vocab, telemetry, false, false, overall);

  return {
    scores,
    vocab,
    overall,
    badges,
    isSpam: false,
    isViolation: false,
    violationReason: '',
    rankPoints,
    feedback,
  };
}

export function findRepeatedWords(text: string, threshold = 3): Map<string, number> {
  const words = tokenize(text);
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length < 4) continue;
    if (COMMON_WORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const result = new Map<string, number>();
  for (const [w, count] of freq) {
    if (count >= threshold) result.set(w, count);
  }
  return result;
}

export function isCriticalWord(word: string): boolean {
  return CRITICAL_WORDS.has(word.toLowerCase());
}

// --- Y-axis tick sanitization utility ---

export function sanitizeYAxisTicks(maxValue: number, tickCount = 5): number[] {
  if (maxValue <= 0) return [0];
  const rawStep = maxValue / (tickCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let niceStep: number;
  if (normalized < 1.5) niceStep = 1 * magnitude;
  else if (normalized < 3) niceStep = 2 * magnitude;
  else if (normalized < 7) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;
  const niceMax = Math.ceil(maxValue / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax; v += niceStep) {
    ticks.push(v);
  }
  return ticks;
}

// --- Dynamic feedback emoji based on score tier ---

export function getDynamicFeedbackEmoji(overall: number, isSpam: boolean, isViolation: boolean): string {
  if (isViolation) return '🚫';
  if (isSpam) return '⚠️';
  if (overall >= 90) return '🌋';
  if (overall >= 75) return '🔥';
  if (overall >= 60) return '🪨';
  if (overall >= 40) return '⛰️';
  if (overall >= 20) return '🌫️';
  return '🕳️';
}

export function getDynamicFeedbackEmojiAnimated(overall: number, isSpam: boolean, isViolation: boolean): { emoji: string; animation: string } {
  if (isViolation) return { emoji: '🚫', animation: 'animate-pulse' };
  if (isSpam) return { emoji: '⚠️', animation: 'animate-bounce' };
  if (overall >= 90) return { emoji: '🌋', animation: 'animate-bounce' };
  if (overall >= 75) return { emoji: '🔥', animation: 'animate-pulse' };
  if (overall >= 60) return { emoji: '🪨', animation: '' };
  if (overall >= 40) return { emoji: '⛰️', animation: '' };
  if (overall >= 20) return { emoji: '🌫️', animation: '' };
  return { emoji: '🕳️', animation: '' };
}

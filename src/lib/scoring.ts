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
  { tier: 'Bronze', min: 0, color: 'from-amber-700 to-amber-900', label: 'Đồng', slang: 'Chân ướt chân ráo', emoji: '🌱' },
  { tier: 'Silver', min: 200, color: 'from-slate-400 to-slate-600', label: 'Bạc', slang: 'Còn non và xanh lắm', emoji: '🍀' },
  { tier: 'Gold', min: 500, color: 'from-yellow-400 to-amber-600', label: 'Vàng', slang: 'Bật mode phản biện · Văn vở level max', emoji: '🔥' },
  { tier: 'Diamond', min: 1000, color: 'from-cyan-400 to-blue-600', label: 'Kim Cương', slang: 'Flex từ vựng · Hệ flex', emoji: '💎' },
  { tier: 'Master', min: 2000, color: 'from-fuchsia-500 to-purple-700', label: 'Master Challenger', slang: 'Chiến thần tư duy · Hệ gắt', emoji: '👑' },
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
      label: 'Chiến thần tự lực',
      emoji: '🛡️',
      desc: 'Không một lần chuyển tab trong suốt phiên làm bài',
    });
  }

  if (vocab.critical >= 8) {
    badges.push({
      id: 'vocab-master',
      label: 'Vua từ vựng phản biện',
      emoji: '📚',
      desc: `Sử dụng ${vocab.critical} từ vựng phản biện/học thuật`,
    });
  }

  const repeatedCount = findRepeatedWords(text, 3).size;
  if (repeatedCount >= 5) {
    badges.push({
      id: 'repeat-fan',
      label: 'Fan cứng của sự lặp từ',
      emoji: '🔄',
      desc: `${repeatedCount} từ bị lặp nhiều lần — Semantic Drift detected`,
    });
  }

  if (scores.depth >= 80) {
    badges.push({
      id: 'deep-thinker',
      label: 'Nhà tư duy sâu',
      emoji: '🧠',
      desc: 'Điểm chiều sâu tư duy đạt 80+',
    });
  }

  if (telemetry.wpm >= 25 && telemetry.wpm <= 35 && telemetry.wordCount > 150) {
    badges.push({
      id: 'flow-state',
      label: 'Trạng thái chảy (Flow)',
      emoji: '🌊',
      desc: 'Tốc độ viết ổn định hoàn hảo, không quá nhanh không quá chậm',
    });
  }

  if (telemetry.idleSeconds > 60 && scores.independence < 50) {
    badges.push({
      id: 'paralysis',
      label: 'Nạn nhân tê liệt biểu đạt',
      emoji: '💤',
      desc: `${telemetry.idleSeconds} giây ngưng gõ — Expressive Paralysis`,
    });
  }

  if (vocab.clicheHits >= 3) {
    badges.push({
      id: 'cliche-king',
      label: 'Hoàng tử sáo rỗng',
      emoji: '👑',
      desc: `${vocab.clicheHits} cụm từ sáo rỗng/mẫu AI được phát hiện`,
    });
  }

  if (telemetry.wordCount >= 300) {
    badges.push({
      id: 'marathon',
      label: 'Vận động viên đường dài',
      emoji: '🏃',
      desc: `Viết ${telemetry.wordCount} từ — bền bỉ suốt phiên`,
    });
  }

  if (scores.depth + scores.fluency + scores.independence + scores.vocabularyCoherence + scores.speed >= 85 * 5) {
    badges.push({
      id: 'champion',
      label: 'Nhà vô địch phản biện',
      emoji: '🏆',
      desc: 'Tổng điểm đạt 85+ — xuất sắc!',
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

// --- LLM Feedback Simulation (Gen-Z hype roasts) ---

export function generateFeedback(
  text: string,
  scores: Scores,
  vocab: VocabStats,
  telemetry: Telemetry,
  isSpam: boolean,
  isViolation: boolean,
): FeedbackCard[] {
  if (isViolation) {
    return [
      {
        title: 'Vi phạm luật chơi',
        icon: '🚫',
        body: 'Bài viết chứa nội dung vi phạm quy định. Hệ thống đã khoá bản ghi này và không tính điểm. Vui lòng viết lại bằng ngôn ngữ phù hợp.',
        tone: 'roast',
      },
    ];
  }

  if (isSpam) {
    return [
      {
        title: 'Định lừa AI à?',
        icon: '💀',
        body: 'Viết có mấy chục từ mà đòi flex? AI không phải đồ ngốc đâu chiến thần. Cố gắng thật sự đi, não cũng cần tập như cơ mà.',
        tone: 'roast',
      },
    ];
  }

  const cards: FeedbackCard[] = [];
  const wc = telemetry.wordCount;
  const templates = detectTemplates(text);
  const repeated = findRepeatedWords(text, 3);

  // Card 1: Phân tích Nội dung & Lập luận (The Deep Dive)
  let depthBody = '';
  if (scores.depth >= 75) {
    depthBody = `Luận điểm core solid! ${wc} từ mà đào sâu tới tầng địa tầng — argument có xương có tủy. Điểm chiều sâu ${scores.depth}/100, gần như overpowered. `;
    if (vocab.critical >= 8) {
      depthBody += `Bonus: ${vocab.critical} từ vựng phản biện deployed — proof rằng não bạn thực sự chạy, không phải copy-paste.`;
    }
  } else if (scores.depth >= 50) {
    depthBody = `Luận điểm có nhưng chưa đủ "cook". ${wc} từ là khởi đầu ổn, nhưng thesis còn generic — cần thêm evidence cụ thể thay vì khẳng định chung chung. Điểm ${scores.depth}/100: không tệ nhưng cũng chưa flex được.`;
    if (templates.length > 0) {
      depthBody += ` Phát hiện ${templates.length} cụm từ sáo rỗng — bỏ đi mấy cái "trong thời đại ngày nay" đi, nó không add gì cho argument đâu.`;
    }
  } else {
    depthBody = `Thesis đâu? Argument đâu? ${wc} từ mà đọc xong vẫn không biết bạn nghĩ gì. Điểm ${scores.depth}/100 — não đang ở chế độ sleep. Cần dig deeper: chọn 1 ý, đào nó tới đáy thay vì surface-level 5 ý lướt qua.`;
  }
  cards.push({
    title: 'Phân tích Nội dung & Lập luận',
    icon: '🧠',
    body: depthBody,
    tone: scores.depth >= 70 ? 'praise' : scores.depth >= 40 ? 'mixed' : 'roast',
  });

  // Card 2: Diagnosis Khả năng diễn đạt & Từ vựng (Lexical Flex)
  let lexBody = '';
  if (vocab.unique >= 100 && vocab.clicheHits === 0) {
    lexBody = `Lexical flex đạt level pro! ${vocab.unique} từ độc nhất, 0 cụm sáo rỗng — vocabulary game strong. Sentence structure đa dạng, register học thuật stable.`;
  } else if (vocab.clicheHits >= 3) {
    lexBody = `${vocab.clicheHits} cụm từ mẫu AI detected — "đóng vai trò quan trọng", "mang lại nhiều lợi ích"... Văn vở level 100. ${vocab.unique} từ độc nhất trên ${vocab.total} tổng — ratio còn thấp. Thay mấy từ basic đó bằng từ phản biện sâu hơn.`;
  } else if (repeated.size >= 5) {
    const topRepeats = Array.from(repeated.entries()).slice(0, 3).map(([w, c]) => `"${w}" (${c}x)`).join(', ');
    lexBody = `Lặp từ nặng nề: ${topRepeats}. Não bị stuck trong loop à? Vocabulary diversity ratio: ${vocab.unique}/${vocab.total}. Cần synonyms — mở thesaurus ra, nó không cắn đâu.`;
  } else {
    lexBody = `Từ vựng ổn, ${vocab.unique} từ độc nhất trên ${vocab.total} tổng. ${vocab.critical} từ phản biện được sử dụng — đủ để không bị gọi là "văn phổ thông" nhưng cũng chưa đủ để flex. Thử thêm 2-3 từ học thuật nữa để push register lên.`;
  }
  cards.push({
    title: 'Diagnosis Khả năng diễn đạt & Từ vựng',
    icon: '📖',
    body: lexBody,
    tone: vocab.unique >= 100 && vocab.clicheHits === 0 ? 'praise' : vocab.clicheHits >= 3 || repeated.size >= 5 ? 'roast' : 'mixed',
  });

  // Card 3: Tính sáng tạo & Lời khuyên cải thiện (The Brain-Cell Upgrade)
  let adviceBody = '';
  if (scores.independence >= 80 && telemetry.tabViolations === 0) {
    adviceBody = `Critical thinking breakthrough! 0 lần chuyển tab — bạn thực sự tự suy nghĩ, không AI-assisted. Đây là mindset cần maintain. `;
  } else if (telemetry.tabViolations > 0) {
    adviceBody = `${telemetry.tabViolations} lần chuyển tab — bạn có đang "reference" AI không? Independence score ${scores.independence}/100. Lần sau thử tắt hết tab, để não tự cook. `;
  } else {
    adviceBody = `Độc lập ở mức ${scores.independence}/100 — ổn nhưng chưa peak. `;
  }

  if (telemetry.idleSeconds > 60) {
    adviceBody += `${telemetry.idleSeconds}s ngưng gõ — Expressive Paralysis detected. Tip: khi bí, đừng dừng — viết bất cứ gì, brain dump rồi edit sau. Flow state quan trọng hơn perfect sentence. `;
  }

  if (scores.speed >= 70) {
    adviceBody += `WPM ${telemetry.wpm} — tốc độ phản xạ tốt, duy trì nhịp này. `;
  }

  adviceBody += `Level up tip: đọc lại bài, circle 3 chỗ generic nhất, thay mỗi chỗ bằng 1 quan sát cụ thể từ kinh nghiệm cá nhân. Đó là cách break semantic drift.`;
  cards.push({
    title: 'Tính sáng tạo & Lời khuyên cải thiện',
    icon: '⚡',
    body: adviceBody,
    tone: scores.independence >= 70 ? 'praise' : 'mixed',
  });

  return cards;
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
  const feedback = generateFeedback(text, scores, vocab, telemetry, false, false);

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
  if (isSpam) return '💀';
  if (overall >= 90) return '🤩';
  if (overall >= 75) return '😎';
  if (overall >= 60) return '🙂';
  if (overall >= 40) return '😐';
  if (overall >= 20) return '😑';
  return '😴';
}

export function getDynamicFeedbackEmojiAnimated(overall: number, isSpam: boolean, isViolation: boolean): { emoji: string; animation: string } {
  if (isViolation) return { emoji: '🚫', animation: 'animate-pulse' };
  if (isSpam) return { emoji: '💀', animation: 'animate-bounce' };
  if (overall >= 90) return { emoji: '🤩', animation: 'animate-bounce' };
  if (overall >= 75) return { emoji: '😎', animation: 'animate-pulse' };
  if (overall >= 60) return { emoji: '🙂', animation: '' };
  if (overall >= 40) return { emoji: '😐', animation: '' };
  if (overall >= 20) return { emoji: '😑', animation: '' };
  return { emoji: '😴', animation: '' };
}

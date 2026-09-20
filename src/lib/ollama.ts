import type { Scores, Telemetry, VocabStats, FeedbackCard } from './scoring';

export type RoadmapContext = {
  currentDay: number;
  overallScore: number;
  scores: Scores;
  weaknesses: string[];
  vocab: VocabStats;
  telemetry: Telemetry;
};

export type RoadmapDay = {
  day: number;
  title: string;
  description: string;
  focus: string;
  exercises: string[];
};

export type EvaluationResult = {
  writingStyle: string;
  argumentConsistency: string;
  semanticDrift: string;
  repetitiveWords: string[];
  cliches: string[];
  overallAssessment: string;
};

async function callOllama(promptText: string): Promise<string> {
 const response = await fetch('https://jake-jumping-bend-specially.trycloudflare.com /api/generate', {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: 'qwen2.5:3b',
      prompt: promptText,
      stream: false,
    }),
  });

  if (!response.ok) throw new Error('Ollama offline');
  const data = await response.json();
  return data.response;
}

function parseJSON<T>(raw: string): T | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// --- Mock fallback data ---

const MOCK_ROADMAP: RoadmapDay[] = [
  {
    day: 1,
    title: 'Khởi động tư duy phản biện',
    description: 'Làm quen với khái niệm phản biện và viết đoạn mở bài có quan điểm rõ ràng.',
    focus: 'Mở bài & đặt vấn đề',
    exercises: ['Viết mở bài 150 từ cho đề tài AI', 'Liệt kê 3 quan điểm trái chiều'],
  },
  {
    day: 2,
    title: 'Xây dựng luận điểm',
    description: 'Tập xây dựng luận điểm chính có dẫn chứng cụ thể, tránh lập luận chung chung.',
    focus: 'Luận điểm & dẫn chứng',
    exercises: ['Viết 2 luận điểm có dẫn chứng', 'Phân tích 1 dẫn chứng thực tế'],
  },
  {
    day: 3,
    title: 'Phản bác & đối đầu',
    description: 'Rèn kỹ năng phản bác luận điểm đối lập một cách sắc bén, không né tránh.',
    focus: 'Phản bác & tranh luận',
    exercises: ['Viết 1 phản bác cho luận điểm trái chiều', 'Tự phản bác lại chính mình'],
  },
  {
    day: 4,
    title: 'Chiều sâu phân tích',
    description: 'Đào sâu vấn đề thay vì lướt bề nổi, bóc tách nhiều tầng ý nghĩa.',
    focus: 'Phân tích đa chiều',
    exercises: ['Phân tích 1 vấn đề từ 3 góc nhìn', 'Viết đoạn phân tích 200 từ'],
  },
  {
    day: 5,
    title: 'Vốn từ phản biện',
    description: 'Mở rộng vốn từ học thuật và phản biện, tránh lặp từ và văn sáo rỗng.',
    focus: 'Từ vựng & diễn đạt',
    exercises: ['Thay 10 từ thông dụng bằng từ học thuật', 'Viết đoạn không lặp từ'],
  },
  {
    day: 6,
    title: 'Tổng hợp & kết luận',
    description: 'Rèn kỹ năng tổng hợp ý tưởng và viết kết luận có sức nặng, không sáo rỗng.',
    focus: 'Kết bài & tổng hợp',
    exercises: ['Viết kết bài 150 từ', 'Tổng hợp 3 luận điểm thành 1 đoạn'],
  },
  {
    day: 7,
    title: 'Bài viết hoàn chỉnh',
    description: 'Viết một bài nghị luận hoàn chỉnh 400+ từ, áp dụng toàn bộ kỹ năng đã rèn.',
    focus: 'Bài viết tổng hợp',
    exercises: ['Viết bài hoàn chỉnh 400+ từ', 'Tự chấm điểm theo 5 tiêu chí'],
  },
];

function buildMockEvaluation(text: string, scores: Scores, vocab: VocabStats, telemetry: Telemetry): EvaluationResult {
  const repeated = new Map<string, number>();
  const words = text.toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const common = new Set(['như', 'của', 'và', 'là', 'cho', 'một', 'có', 'không', 'đó', 'này', 'với', 'được', 'trong', 'khi', 'các', 'người', 'để', 'cũng', 'sẽ', 'theo', 'từ', 'rất', 'nhiều', 'làm', 'nên', 'về', 'mà', 'thì', 'đã', 'những', 'gì', 'ai', 'đi', 'lên', 'xuống', 'vào', 'ra', 'tốt', 'xấu', 'hay', 'đẹp', 'to', 'nhỏ', 'cao', 'thấp', 'thật', 'quá', 'lắm', 'hơn', 'nhất']);
  for (const w of words) {
    if (w.length < 4 || common.has(w)) continue;
    repeated.set(w, (repeated.get(w) || 0) + 1);
  }
  const repetitiveWords = Array.from(repeated.entries()).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);

  const clichePhrases = [
    'trong thời đại ngày nay', 'trong xã hội hiện đại', 'như chúng ta đã biết', 'nói chung',
    'tóm lại', 'điều này cho thấy', 'từ xưa đến nay', 'thời đại 4.0', 'đón đầu xu thế',
    'không thể phủ nhận', 'đóng vai trò quan trọng', 'trong bối cảnh', 'mang lại nhiều lợi ích',
  ];
  const lower = text.toLowerCase();
  const cliches = clichePhrases.filter(p => lower.includes(p));

  const styleScore = scores.fluency;
  const argScore = scores.depth;
  const driftScore = scores.independence;

  const writingStyle = styleScore >= 70
    ? `Văn phong trôi chảy (điểm ${styleScore}/100), cấu trúc câu đa dạng và giữ được mạch văn ổn định.`
    : styleScore >= 40
    ? `Văn phong ở mức trung bình (điểm ${styleScore}/100), cần đa dạng cấu trúc câu và giảm tỷ lệ xoá.`
    : `Văn phong yếu (điểm ${styleScore}/100), câu văn lủng củng, cần rèn thêm nhịp điệu hành văn.`;

  const argumentConsistency = argScore >= 70
    ? `Lập luận nhất quán (điểm ${argScore}/100), luận điểm được duy trì xuyên suốt, dẫn chứng phù hợp.`
    : argScore >= 40
    ? `Lập luận tương đối nhất quán (điểm ${argScore}/100), một số đoạn bị chệch hướng, cần liên kết ý chặt chẽ hơn.`
    : `Lập luận thiếu nhất quán (điểm ${argScore}/100), các luận điểm rời rạc, cần xây dựng dàn ý trước khi viết.`;

  const semanticDrift = driftScore >= 70
    ? `Tính độc lập cao (điểm ${driftScore}/100), không phát hiện dấu hiệu lệ thuộc AI đáng kể.`
    : driftScore >= 40
    ? `Tính độc lập trung bình (điểm ${driftScore}/100), ${telemetry.tabViolations > 0 ? `phát hiện ${telemetry.tabViolations} lần chuyển tab` : 'một số đoạn có dấu hiệu văn mẫu'}.`
    : `Tính độc lập thấp (điểm ${driftScore}/100), phát hiện dấu hiệu lệ thuộc AI: ${telemetry.tabViolations > 0 ? `${telemetry.tabViolations} lần chuyển tab, ` : ''}thời gian ngưng gõ ${telemetry.idleSeconds}s, văn phong rập khuôn.`;

  return {
    writingStyle,
    argumentConsistency,
    semanticDrift,
    repetitiveWords,
    cliches,
    overallAssessment: `Bài viết đạt tổng điểm ${Math.round((styleScore + argScore + driftScore + scores.vocabularyCoherence + scores.speed) / 5)}/100. ${repetitiveWords.length > 0 ? `Phát hiện ${repetitiveWords.length} từ lặp lại: ${repetitiveWords.join(', ')}.` : 'Không phát hiện lặp từ nghiêm trọng.'} ${cliches.length > 0 ? `Phát hiện ${cliches.length} cụm sáo rỗng.` : 'Không phát hiện sáo rỗng.'}`,
  };
}

// --- Public API ---

export async function generateRoadmap(ctx: RoadmapContext): Promise<RoadmapDay[]> {
  const weaknessesStr = ctx.weaknesses.length > 0
    ? ctx.weaknesses.join(', ')
    : 'chưa xác định rõ điểm yếu';

  const prompt = `Bạn là chuyên gia giáo dục thiết kế lộ trình 7 ngày rèn tư duy phản biện cho học sinh THPT.

Thông tin học sinh:
- Ngày hiện tại: ${ctx.currentDay}/7
- Tổng điểm gần nhất: ${ctx.overallScore}/100
- Điểm chiều sâu: ${ctx.scores.depth}/100
- Điểm diễn đạt: ${ctx.scores.fluency}/100
- Điểm độc lập: ${ctx.scores.independence}/100
- Điểm từ vựng: ${ctx.scores.vocabularyCoherence}/100
- Điểm tốc độ: ${ctx.scores.speed}/100
- Điểm yếu cần khắc phục: ${weaknessesStr}
- Số từ độc nhất: ${ctx.vocab.unique}/${ctx.vocab.total}
- Tốc độ viết: ${ctx.telemetry.wpm} từ/phút

Hãy tạo lộ trình 7 ngày bắt đầu từ ngày ${ctx.currentDay}, mỗi ngày có tiêu đề, mô tả, trọng tâm và 2 bài tập. Trả về JSON theo định dạng:
{"roadmap": [{"day": 1, "title": "...", "description": "...", "focus": "...", "exercises": ["...", "..."]}]}
Chỉ trả về JSON, không thêm giải thích.`;

  try {
    const raw = await callOllama('Bạn là trợ lý AI giáo dục tiếng Việt.\n\n' + prompt);
    const parsed = parseJSON<{ roadmap: RoadmapDay[] }>(raw);
    if (parsed?.roadmap && Array.isArray(parsed.roadmap) && parsed.roadmap.length > 0) {
      return parsed.roadmap.slice(0, 7);
    }
    return MOCK_ROADMAP;
  } catch {
    return MOCK_ROADMAP;
  }
}

export async function evaluateSubmission(
  text: string,
  scores: Scores,
  vocab: VocabStats,
  telemetry: Telemetry,
): Promise<EvaluationResult> {
  const prompt = `Bạn là giám khảo chấm bài nghị luận tư duy phản biện học sinh THPT theo tiêu chí KHKT.

Bài viết của học sinh:
"""
${text.slice(0, 2000)}
"""

Thông số:
- Điểm chiều sâu: ${scores.depth}/100
- Điểm diễn đạt: ${scores.fluency}/100
- Điểm độc lập: ${scores.independence}/100
- Điểm từ vựng: ${scores.vocabularyCoherence}/100
- Điểm tốc độ: ${scores.speed}/100
- Số từ: ${telemetry.wordCount}, từ độc nhất: ${vocab.unique}
- Tốc độ: ${telemetry.wpm} từ/phút, chuyển tab: ${telemetry.tabViolations} lần
- Cliché phát hiện: ${vocab.clicheHits}

Hãy đánh giá theo các tiêu chí sau:
1. writingStyle: Phong cách viết (cấu trúc câu, nhịp điệu, mạch văn)
2. argumentConsistency: Tính nhất quán lập luận (luận điểm có duy trì không, dẫn chứng phù hợp không)
3. semanticDrift: Phụ thuộc AI (Semantic Drift) — phát hiện dấu hiệu văn mẫu, lối mòn, phụ thuộc công cụ
4. repetitiveWords: Mảng các từ bị lặp lại nhiều lần (từ thực, bỏ qua từ thông dụng)
5. cliches: Mảng các cụm từ sáo rỗng hoặc boilerplate AI phát hiện
6. overallAssessment: Đánh giá tổng quan 2-3 câu

Trả về JSON theo định dạng:
{"writingStyle": "...", "argumentConsistency": "...", "semanticDrift": "...", "repetitiveWords": ["..."], "cliches": ["..."], "overallAssessment": "..."}
Chỉ trả về JSON, không thêm giải thích.`;

  try {
    const raw = await callOllama('Bạn là trợ lý AI đánh giá bài viết tiếng Việt.\n\n' + prompt);
    const parsed = parseJSON<EvaluationResult>(raw);
    if (parsed && parsed.writingStyle && parsed.argumentConsistency) {
      return parsed;
    }
    return buildMockEvaluation(text, scores, vocab, telemetry);
  } catch {
    return buildMockEvaluation(text, scores, vocab, telemetry);
  }
}

export function isOllamaAvailable(): boolean {
  return true;
}

export { buildMockEvaluation, MOCK_ROADMAP };

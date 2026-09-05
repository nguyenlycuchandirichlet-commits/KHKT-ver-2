export type RoadmapFeedback = {
  depth: string;
  vocab: string;
  advice: string;
};

export type FeedbackContext = {
  score: number;
  logicIndex: number;
  uniqueWords: number;
  totalWords: number;
  wpm: number;
  debateRounds: number;
  fallacyCount: number;
  repetitionCount: number;
  clicheCount: number;
  idleSeconds: number;
  tabViolations: number;
  userId: string;
  timestamp: number;
  rawText: string;
};

export type Tier = 'weak' | 'medium' | 'good';
export type TieredSlot = Record<Tier, string[]>;
export type TieredFrame = [TieredSlot, TieredSlot, TieredSlot, TieredSlot, TieredSlot];

// --- Quote extraction from student text ---
export type Quotes = Record<string, string>;

export function extractQuotes(text: string): Quotes {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const cleanSentences = sentences.map(s => s.trim()).filter(s => s.length > 5);
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const wordFreq: Record<string, number> = {};
  for (const w of words) {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  }
  const repeatedWordsList = Object.entries(wordFreq)
    .filter(([w, c]) => c > 2 && w.length > 3)
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);
  const uniqueWordsList = [...new Set(words.filter(w => w.length > 4))];

  const firstSentence = cleanSentences[0]?.slice(0, 80) || text.slice(0, 80);
  const sortedByLen = [...cleanSentences].sort((a, b) => a.length - b.length);
  const weakArgument = sortedByLen[0]?.slice(0, 80) || firstSentence;
  const strongArgument = sortedByLen[sortedByLen.length - 1]?.slice(0, 80) || firstSentence;
  const averageArgument = sortedByLen[Math.floor(sortedByLen.length / 2)]?.slice(0, 80) || firstSentence;
  const targetSegment = cleanSentences[Math.floor(cleanSentences.length / 2)]?.slice(0, 80) || firstSentence;
  const flawedSection = sortedByLen[0]?.slice(0, 60) || text.slice(0, 60);
  const solidSection = sortedByLen[sortedByLen.length - 1]?.slice(0, 60) || text.slice(0, 60);
  const connectedSection = cleanSentences[1]?.slice(0, 60) || firstSentence.slice(0, 60);
  const awkwardSentence = sortedByLen[0]?.slice(0, 60) || text.slice(0, 60);
  const normalSentence = averageArgument.slice(0, 60);
  const fluidSentence = sortedByLen[sortedByLen.length - 1]?.slice(0, 60) || text.slice(0, 60);
  const stalledSegment = sortedByLen[0]?.slice(0, 60) || text.slice(0, 60);
  const decentSegment = averageArgument.slice(0, 60);
  const brilliantSegment = sortedByLen[sortedByLen.length - 1]?.slice(0, 60) || text.slice(0, 60);
  const lowResultSegment = sortedByLen[0]?.slice(0, 60) || text.slice(0, 60);
  const currentBase = averageArgument.slice(0, 60);
  const triumphSegment = sortedByLen[sortedByLen.length - 1]?.slice(0, 60) || text.slice(0, 60);
  const weakPoint = sortedByLen[0]?.slice(0, 60) || text.slice(0, 60);
  const targetImprovement = averageArgument.slice(0, 60);
  const strongSegment = sortedByLen[sortedByLen.length - 1]?.slice(0, 60) || text.slice(0, 60);
  const dependentSegment = sortedByLen[0]?.slice(0, 60) || text.slice(0, 60);
  const independentSegment = averageArgument.slice(0, 60);
  const authenticSegment = sortedByLen[sortedByLen.length - 1]?.slice(0, 60) || text.slice(0, 60);

  const clichePhrases = ['trong xã hội hiện đại', 'ngày nay', 'đó là', 'thực tế cho thấy', 'như chúng ta đã biết', 'tóm lại', 'nói tóm lại', 'về mặt bản chất', 'có thể nói rằng', 'từ xưa đến nay'];
  const foundCliches = cleanSentences.filter(s => clichePhrases.some(c => s.toLowerCase().includes(c)));
  const clicheSegment = foundCliches[0]?.slice(0, 60) || sortedByLen[0]?.slice(0, 60) || text.slice(0, 60);

  const copiedPhrase = clicheSegment;
  const originalPhrase = uniqueWordsList.length > 3
    ? `${uniqueWordsList[0]} ${uniqueWordsList[1] || ''}`.trim()
    : text.slice(0, 40);
  const personalAttempt = averageArgument.slice(0, 50);
  const moderateIdea = averageArgument.slice(0, 60);
  const visionarySentence = sortedByLen[sortedByLen.length - 1]?.slice(0, 60) || text.slice(0, 60);

  const repeatedWords = repeatedWordsList[0] || words[0] || 'thực';
  const standardWords = uniqueWordsList[0] || words[0] || 'vấn đề';
  const richVocabulary = uniqueWordsList.find(w => w.length > 6) || uniqueWordsList[0] || 'chiều sâu';

  const forcedVocabulary = repeatedWords;
  const clearExpression = standardWords;
  const elegantSentence = fluidSentence;

  const misusedTerm = repeatedWords;
  const properTerm = standardWords;
  const preciseTerm = richVocabulary;

  return {
    firstSentence, weakArgument, strongArgument, averageArgument, targetSegment,
    copiedPhrase, originalPhrase, personalAttempt, flawedSection, solidSection, connectedSection,
    awkwardSentence, normalSentence, fluidSentence, stalledSegment, decentSegment, brilliantSegment,
    lowResultSegment, currentBase, triumphSegment, weakPoint, targetImprovement, strongSegment,
    dependentSegment, independentSegment, authenticSegment, clicheSegment, moderateIdea, visionarySentence,
    repeatedWords, standardWords, richVocabulary, forcedVocabulary, clearExpression, elegantSentence,
    misusedTerm, properTerm, preciseTerm,
  };
}

// --- Template filling ---
export function fill(str: string, ctx: FeedbackContext, quotes: Quotes): string {
  let result = str;
  const replacements: Record<string, string> = {
    score: String(ctx.score),
    logicIndex: String(ctx.logicIndex),
    uniqueWords: String(ctx.uniqueWords),
    totalWords: String(ctx.totalWords),
    wpm: String(ctx.wpm),
    debateRounds: String(ctx.debateRounds),
    fallacyCount: String(ctx.fallacyCount),
    repetitionCount: String(ctx.repetitionCount),
    clicheCount: String(ctx.clicheCount),
    idleSeconds: String(ctx.idleSeconds),
    tabViolations: String(ctx.tabViolations),
  };
  for (const [k, v] of Object.entries(replacements)) {
    result = result.split(`{${k}}`).join(v);
  }
  for (const [k, v] of Object.entries(quotes)) {
    result = result.split(`{${k}}`).join(v);
  }
  return result;
}

// --- Seeded hash ---
export function seededHash(seed: number): number {
  let h = 2166136261 ^ seed;
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

function buildSeed(ctx: FeedbackContext): number {
  let s = 0;
  for (let i = 0; i < ctx.userId.length; i++) {
    s = (s * 31 + ctx.userId.charCodeAt(i)) | 0;
  }
  s = (s * 31 + ctx.totalWords) | 0;
  s = (s * 31 + Math.floor(ctx.timestamp / 1000)) | 0;
  s = (s * 31 + ctx.score) | 0;
  return s >>> 0;
}

export function selectTier(score: number): Tier {
  if (score < 40) return 'weak';
  if (score < 70) return 'medium';
  return 'good';
}

// --- Frame 1: Phân tích Nội dung & Lập luận ---
const FRAME1: TieredFrame = [
  {
    weak: [
      `Mở bài qua câu "${'{firstSentence}'}" còn lúng túng, sa đà vào kể lể lan man và lộ rõ sự bối rối khi bị cô lập khỏi sự hỗ trợ của AI.`,
      `Cách đặt vấn đề tại câu "${'{firstSentence}'}" mờ nhạt, dính lối mòn sáo rỗng, không thể hiện được tư duy độc lập tối thiểu.`,
      `Khởi đầu với ý "${'{firstSentence}'}" thiếu mạch lạc, lộ rõ sự hời hợt và sai lệch ngay từ những dòng đầu tiên của bài làm.`,
      `Mở bài trôi dạt qua câu "${'{firstSentence}'}", cấu trúc gãy khúc, phản ánh sự thiếu chuẩn bị kỹ lưỡng trước trang giấy trắng.`,
      `Cách dẫn dắt ở câu "${'{firstSentence}'}" bộc lộ sự lệ thuộc vào văn mẫu, không tạo được điểm tựa vững chắc cho phần triển khai.`,
      `Khởi động yếu ớt qua câu "${'{firstSentence}'}", không bắt nhịp đúng bản chất đề tài và thiếu hẳn tư duy phản biện.`,
      `Mở đầu bằng câu "${'{firstSentence}'}" cho thấy sự bế tắc trong định hướng vấn đề, bố cục lỏng lẻo và thiếu chiều sâu.`,
      `Cách đặt vấn đề qua ý "${'{firstSentence}'}" quá an toàn và rập khuôn, không tạo được động lực để theo dõi các phần tiếp theo.`,
      `Khởi đầu ngô nghê qua câu "${'{firstSentence}'}", làm giảm độ tin cậy ban đầu của toàn bộ hệ thống lập luận.`,
      `Mở bài hụt hẫng qua cách viết "${'{firstSentence}'}", không xác định rõ ranh giới vấn đề cần nghị luận.`,
    ],
    medium: [
      `Mở bài qua câu "${'{firstSentence}'}" ở mức an toàn, bám sát đề bài nhưng cách vào đề vẫn còn rụt rè, thiếu đột phá.`,
      `Cách đặt vấn đề tại ý "${'{firstSentence}'}" đủ ý nhưng góc nhìn còn khá phẳng, thiếu sự sắc sảo cần thiết.`,
      `Khởi đầu bằng câu "${'{firstSentence}'}" tạo tiền đề ổn định, tuy nhiên chưa khai thác được các góc khuất sâu sắc.`,
      `Mở bài qua câu "${'{firstSentence}'}" giữ được nhịp độ tròn vai, phản ánh mức độ nhận thức cơ bản của học sinh.`,
      `Cách dẫn dắt qua ý "${'{firstSentence}'}" mạch lạc vừa đủ, tuy nhiên cấu trúc lập luận chưa thực sự nổi bật.`,
      `Khởi động qua câu "${'{firstSentence}'}" thể hiện sự nghiêm túc nhưng bố cục còn thiếu cá tính riêng.`,
      `Mở bài với câu "${'{firstSentence}'}" đạt chuẩn mực chung, giữ bài viết không bị lạc trôi khỏi trọng tâm.`,
      `Cách đặt vấn đề qua ý "${'{firstSentence}'}" phản ánh đúng hướng đi cơ bản, chưa có điểm nhấn phản biện mạnh mẽ.`,
      `Khởi đầu bằng câu "${'{firstSentence}'}" trôi chảy ở mức chấp nhận được, bảo đảm tính rõ nghĩa ban đầu.`,
      `Mở bài qua câu "${'{firstSentence}'}" duy trì sự cẩn trọng đáng ghi nhận trong khuôn khổ cho phép.`,
    ],
    good: [
      `Mở bài sắc sảo qua câu "${'{firstSentence}'}", trực diện bước vào vấn đề với bản lĩnh tư duy độc lập rất đáng nể.`,
      `Cách đặt vấn đề cực kỳ tinh tế qua ý "${'{firstSentence}'}", thể hiện tầm nhìn sâu sắc và bản lĩnh lập luận vững vàng.`,
      `Khởi đầu lôi cuốn bằng câu "${'{firstSentence}'}", định vị chính xác trọng tâm và mở ra không gian đa chiều xuất sắc.`,
      `Mở bài qua câu "${'{firstSentence}'}" là minh chứng sống động cho năng lực tư duy tự chủ tuyệt vời.`,
      `Cách dẫn dắt mang dấu ấn cá nhân rực rỡ qua ý "${'{firstSentence}'}", tránh hoàn toàn lối mòn rập khuôn.`,
      `Khởi động vững chãi bằng câu "${'{firstSentence}'}", tạo bệ phóng hoàn hảo cho toàn bộ hệ thống luận điểm.`,
      `Mở bài qua câu "${'{firstSentence}'}" bộc lộ năng lực phân tích vượt trội và độ chín trong nhận thức.`,
      `Cách đặt vấn đề thông minh qua ý "${'{firstSentence}'}" gây được thiện cảm lớn nhờ sự thấu đáo trong tư duy.`,
      `Khởi đầu sắc bén bằng câu "${'{firstSentence}'}", khẳng định phong độ độc bản và uy lực lập luận.`,
      `Mở bài qua câu "${'{firstSentence}'}" đạt chuẩn mực học thuật cao, mở ra mạch văn vô cùng cuốn hút.`,
    ],
  },
  {
    weak: [
      `Đạt mức điểm thấp ${'{score}'}/100 với hệ số logic ${'{logicIndex}'}/5; điển hình tại luận điểm "${'{weakArgument}'}", chuỗi suy luận bị đứt gãy nghiêm trọng do ngụy biện.`,
      `Với kết quả ${'{score}'}/100 điểm và mức logic ${'{logicIndex}'}/5, đoạn "${'{weakArgument}'}" phản ánh tư duy non yếu, lộ rõ nhiều bước nhảy cóc vô căn cứ.`,
      `Chỉ số định lượng đạt ${'{score}'}/100 điểm kèm tham số logic ${'{logicIndex}'}/5; cụ thể ở ý "${'{weakArgument}'}", cấu trúc lỏng lẻo và thiếu hẳn luận cứ xác đáng.`,
      `Mốc ${'{score}'}/100 điểm và hệ số ${'{logicIndex}'}/5 tại đoạn "${'{weakArgument}'}" cho thấy học sinh gặp khó khăn lớn trong việc tự lập luận.`,
      `Thông số ghi nhận ${'{score}'}/100 điểm cùng hệ số logic ${'{logicIndex}'}/5; qua cách triển khai "${'{weakArgument}'}", bài viết hụt hơi rõ rệt trong tư duy.`,
      `Điểm số dừng lại ở ${'{score}'}/100 với mức logic ${'{logicIndex}'}/5; ví dụ như ở đoạn "${'{weakArgument}'}", mối liên kết lập luận hoàn toàn bế tắc.`,
      `Định mức ${'{score}'}/100 điểm và chỉ số logic ${'{logicIndex}'}/5 tại ý "${'{weakArgument}'}" cho thấy tư duy phân tích sa đà vào cảm tính.`,
      `Kết quả ${'{score}'}/100 điểm cùng hệ số cấu trúc ${'{logicIndex}'}/5 qua đoạn "${'{weakArgument}'}" bộc lộ sự thiếu hụt trầm trọng tính logic.`,
      `Mức ${'{score}'}/100 điểm kết hợp hệ số logic ${'{logicIndex}'}/5 tại đoạn "${'{weakArgument}'}" khép lại phần định lượng với nhiều điểm trừ lớn.`,
      `Chỉ số ${'{score}'}/100 điểm cùng tham số logic ${'{logicIndex}'}/5 ở ý "${'{weakArgument}'}" phơi bày sự đứt gãy trong chuỗi nhân quả.`,
    ],
    medium: [
      `Đạt điểm trung bình ${'{score}'}/100 với hệ số logic ${'{logicIndex}'}/5; tại đoạn "${'{averageArgument}'}", cấu trúc bài duy trì sự ổn định ở mức cơ bản.`,
      `Ghi nhận mốc ${'{score}'}/100 điểm cùng chỉ số logic ${'{logicIndex}'}/5; ý "${'{averageArgument}'}" cho thấy tư duy phân tích đạt độ an toàn.`,
      `Chỉ số định lượng ${'{score}'}/100 điểm kèm mức logic ${'{logicIndex}'}/5 qua đoạn "${'{averageArgument}'}" chứng tỏ lập luận có cố gắng nhưng chưa sâu.`,
      `Với ${'{score}'}/100 điểm và hệ số ${'{logicIndex}'}/5 tại ý "${'{averageArgument}'}", bài viết giữ được mức độ hoàn thiện ở tầm trung.`,
      `Mức điểm ${'{score}'}/100 cùng chỉ số logic ${'{logicIndex}'}/5 ở đoạn "${'{averageArgument}'}" biểu thị quá trình vận dụng tư duy vừa đủ.`,
      `Hệ thống ghi nhận ${'{score}'}/100 điểm và mức độ logic ${'{logicIndex}'}/5; đoạn "${'{averageArgument}'}" phản ánh nỗ lực duy trì mạch suy luận.`,
      `Định mức ${'{score}'}/100 điểm kèm hệ số lập luận ${'{logicIndex}'}/5 tại ý "${'{averageArgument}'}" cho thấy tư duy ở mức tròn vai.`,
      `Số liệu đạt ${'{score}'}/100 điểm cùng chỉ số cấu trúc ${'{logicIndex}'}/5 qua đoạn "${'{averageArgument}'}" thể hiện sự kiểm soát nhịp ở mức khá.`,
      `Chạm mốc ${'{score}'}/100 điểm với hệ số logic ${'{logicIndex}'}/5; ví dụ như ở ý "${'{averageArgument}'}", bài làm giữ được tính nhất quán tương đối.`,
      `Kết quả định lượng ${'{score}'}/100 điểm cùng mức logic ${'{logicIndex}'}/5 tại đoạn "${'{averageArgument}'}" cho thấy hướng đi đúng nhưng thiếu bứt phá.`,
    ],
    good: [
      `Đạt mức xuất sắc ${'{score}'}/100 với hệ số logic ${'{logicIndex}'}/5; khẳng định qua đoạn "${'{strongArgument}'}" một tư duy phản biện sắc bén tuyệt đối.`,
      `Ghi nhận mốc ấn tượng ${'{score}'}/100 cùng chỉ số logic ${'{logicIndex}'}/5; đoạn "${'{strongArgument}'}" minh chứng cho năng lực phân tích vượt trội.`,
      `Chỉ số định lượng ${'{score}'}/100 điểm đi kèm mức logic ${'{logicIndex}'}/5 tại ý "${'{strongArgument}'}" thể hiện cấu trúc lập luận cực kỳ chặt chẽ.`,
      `Với ${'{score}'}/100 điểm và hệ số ${'{logicIndex}'}/5 qua đoạn "${'{strongArgument}'}", bài viết đạt chuẩn mực học thuật rất cao.`,
      `Mức điểm tuyệt vời ${'{score}'}/100 cùng hệ số logic ${'{logicIndex}'}/5 ở ý "${'{strongArgument}'}" biểu thị khả năng kiểm soát vấn đề xuất sắc.`,
      `Hệ thống ghi nhận ${'{score}'}/100 điểm và mức độ logic ${'{logicIndex}'}/5; đoạn "${'{strongArgument}'}" phản ánh tư duy logic đỉnh cao.`,
      `Định mức ${'{score}'}/100 điểm kèm hệ số lập luận ${'{logicIndex}'}/5 tại ý "${'{strongArgument}'}" khẳng định sự vững vàng trong nhận thức.`,
      `Số liệu đánh giá đạt ${'{score}'}/100 điểm cùng chỉ số cấu trúc ${'{logicIndex}'}/5 qua đoạn "${'{strongArgument}'}" thể hiện sự thấu đáo tuyệt đối.`,
      `Chạm ngưỡng ${'{score}'}/100 điểm với hệ số logic ${'{logicIndex}'}/5; ví dụ như ở ý "${'{strongArgument}'}", bài làm giữ phong độ hoàn hảo.`,
      `Kết quả định lượng ${'{score}'}/100 điểm cùng mức logic ${'{logicIndex}'}/5 tại đoạn "${'{strongArgument}'}" khép lại khung điểm số với chất lượng tối ưu.`,
    ],
  },
  {
    weak: [
      `Phân tích hời hợt tại đoạn "${'{targetSegment}'}", chỉ lướt qua bề nổi và hoàn toàn bỏ quên bản chất cốt lõi của vấn đề.`,
      `Chuỗi nhân quả bị bóp méo rõ ràng ở đoạn "${'{targetSegment}'}", các luận cứ bổ trợ mâu thuẫn lẫn nhau và thiếu sức nặng.`,
      `Tư duy đơn chiều tại ý "${'{targetSegment}'}", không thấy được các góc khuất hay hệ lụy phức tạp của đề tài.`,
      `Sa đà vào kể lể chi tiết vụn vặt ở đoạn "${'{targetSegment}'}", không bóc tách được các tầng ý tưởng lớn.`,
      `Lập luận thiếu căn cứ thực tế tại đoạn "${'{targetSegment}'}", mang tính suy diễn cảm tính và kém logic.`,
      `Độ sâu phân tích đuối sức thấy rõ tại đoạn "${'{targetSegment}'}", cạn ý tưởng và đuối lý hoàn toàn.`,
      `Mối liên kết lỏng lẻo ở đoạn "${'{targetSegment}'}" tạo cảm giác chắp vá, rời rạc cho toàn bộ phần thân bài.`,
      `Nội dung nghèo nàn qua cách triển khai tại đoạn "${'{targetSegment}'}", không đưa ra được lập luận mang chiều sâu học thuật.`,
      `Cách giải quyết vấn đề tại ý "${'{targetSegment}'}" mang tính đối phó, né tránh các khía cạnh phức tạp.`,
      `Hệ thống phân tích thiếu tính hệ thống ở đoạn "${'{targetSegment}'}", trôi dạt xa rời mục tiêu cốt lõi.`,
    ],
    medium: [
      `Phân tích ở mức vừa đủ tại đoạn "${'{targetSegment}'}", đề cập đúng các ý chính nhưng chưa thật sự sắc sảo.`,
      `Mối liên kết nhân quả tại ý "${'{targetSegment}'}" được duy trì ở mức cơ bản, bảo đảm tính dễ hiểu.`,
      `Tác giả có nỗ lực nhìn nhận đa chiều ở đoạn "${'{targetSegment}'}" nhưng độ sâu chưa thực sự thấm đẫm.`,
      `Các luận cứ bổ trợ tại đoạn "${'{targetSegment}'}" rõ ràng, tuy nhiên còn thiếu các dẫn chứng mang tính đột phá.`,
      `Bóc tách vấn đề tương đối rành mạch ở đoạn "${'{targetSegment}'}", không rơi vào tình trạng lan man quá mức.`,
      `Độ sâu lập luận tại ý "${'{targetSegment}'}" đạt mức trung bình, giữ được sự ổn định cần thiết.`,
      `Cách giải quyết vấn đề ở đoạn "${'{targetSegment}'}" an toàn, tuân thủ đúng các khung cấu trúc tiêu chuẩn.`,
      `Tư duy hệ thống xuất hiện tại đoạn "${'{targetSegment}'}" nhưng độ sâu chưa đồng đều xuyên suốt.`,
      `Mỗi luận điểm triển khai ở đoạn "${'{targetSegment}'}" có chuẩn bị lý lẽ nhưng sức nặng thuyết phục chưa cao.`,
      `Khung phân tích tại ý "${'{targetSegment}'}" giữ được độ ổn định nhất định, đáp ứng yêu cầu cơ bản.`,
    ],
    good: [
      `Phân tích cực kỳ sâu sắc tại đoạn "${'{targetSegment}'}", xoáy sâu vào bản chất và lột tả trọn vẹn tầng ý nghĩa cốt lõi.`,
      `Chuỗi nhân quả được thiết lập vô cùng chặt chẽ ở đoạn "${'{targetSegment}'}", tạo sức nặng thuyết phục tuyệt đối.`,
      `Tư duy đa chiều xuất sắc qua đoạn "${'{targetSegment}'}", bóc tách tinh tế mọi góc khuất phức tạp của đề tài.`,
      `Các luận cứ đanh thép tại đoạn "${'{targetSegment}'}" kết hợp lý luận và thực tiễn cực kỳ nhuần nhuyễn.`,
      `Độ sâu lập luận duy trì đỉnh cao tại đoạn "${'{targetSegment}'}", khẳng định tư duy chín chắn của người viết.`,
      `Hệ thống phân tích tại đoạn "${'{targetSegment}'}" mang tầm vóc nghiên cứu khoa học thực thụ, sắc bén và tin cậy.`,
      `Tác giả làm chủ hoàn toàn bản chất vấn đề qua đoạn "${'{targetSegment}'}", không có bất kỳ khoảng trống logic nào.`,
      `Sự sắc sảo trong việc kết nối ý tưởng tại đoạn "${'{targetSegment}'}" tạo ra giá trị học thuật rất cao.`,
      `Khả năng phân rã vấn đề lớn thành luận điểm nhỏ vô cùng xuất sắc tại đoạn "${'{targetSegment}'}".`,
      `Độ sâu nhận thức vượt trội thể hiện rõ qua đoạn "${'{targetSegment}'}", khép lại khung phân tích cực kỳ ấn tượng.`,
    ],
  },
  {
    weak: [
      `Lộ rõ sự lệ thuộc vào văn mẫu qua cụm từ "${'{copiedPhrase}'}", thiếu hoàn toàn dấu ấn cá nhân và tư duy phản biện.`,
      `Tư duy thụ động thể hiện rõ qua câu "${'{copiedPhrase}'}", câu chữ lủng củng do thiếu năng lực tự chủ lập luận thực chiến.`,
      `Bài viết mang nặng tính sao chép qua đoạn "${'{copiedPhrase}'}", không dám thể hiện quan điểm trái chiều độc lập.`,
      `Sự thiếu tự tin bộc lộ qua ý "${'{copiedPhrase}'}", diễn đạt rụt rè và hoàn toàn không có chính kiến riêng.`,
      `Mất phương hướng nghiêm trọng khi xuất hiện cấu trúc sao chép tại đoạn "${'{copiedPhrase}'}".`,
      `Dấu ấn cá nhân mờ nhạt qua cách dùng văn mẫu ở cụm "${'{copiedPhrase}'}", tư duy bị đồng hóa vào khuôn mẫu.`,
      `Sự rập khuôn cứng nhắc minh chứng qua câu "${'{copiedPhrase}'}", làm mất đi hoàn toàn tính nguyên bản.`,
      `Thiếu vắng sự chủ động trong tư duy phản biện, minh chứng cụ thể qua cách viết rập khuôn tại đoạn "${'{copiedPhrase}'}".`,
      `Sự lúng túng khi tự lập luận phản ánh qua câu "${'{copiedPhrase}'}", năng lực tự chủ còn nhiều hạn chế.`,
      `Không tìm thấy tư duy độc bản, đoạn "${'{copiedPhrase}'}" mang màu sắc phô pho, sao chép lộ liễu.`,
    ],
    medium: [
      `Có cố gắng thể hiện tiếng nói cá nhân qua ý "${'{personalAttempt}'}", dù đôi chỗ vẫn bị ảnh hưởng bởi lối viết chung.`,
      `Tư duy độc lập ở mức vừa phải thể hiện tại đoạn "${'{personalAttempt}'}", giữ được sự tự chủ cơ bản.`,
      `Quan điểm cá nhân xuất hiện qua ý "${'{personalAttempt}'}" nhưng chưa đủ mạnh để tạo dấu ấn khác biệt lớn.`,
      `Sự tự chủ lập luận đạt mức an toàn qua đoạn "${'{personalAttempt}'}", không quá lệ thuộc nhưng thiếu bứt phá.`,
      `Tác giả thể hiện nỗ lực tự lực làm bài qua ý "${'{personalAttempt}'}" đáng ghi nhận dù văn phong chưa đột phá.`,
      `Dấu ấn cá nhân ghi nhận qua câu "${'{personalAttempt}'}" ở mức tròn vai, bảo đảm tính xác thực sản phẩm.`,
      `Màu sắc riêng phảng phất qua cách chọn ví dụ tại đoạn "${'{personalAttempt}'}" nhưng chưa xuyên suốt.`,
      `Tư duy tự chủ đạt tiêu chuẩn qua câu "${'{personalAttempt}'}", không có dấu hiệu sao chép thô thiển.`,
      `Sự độc lập trong suy nghĩ duy trì ổn định qua đoạn "${'{personalAttempt}'}" trong khuôn khổ cho phép.`,
      `Ý thức tự chủ tốt ở ý "${'{personalAttempt}'}", tuy nhiên cần thêm sự phóng khoáng để tạo bản sắc.`,
    ],
    good: [
      `Dấu ấn tư duy độc lập rực rỡ qua câu "${'{originalPhrase}'}", khẳng định năng lực tự chủ hoàn toàn xuất sắc.`,
      `Bản sắc cá nhân đậm nét qua ý "${'{originalPhrase}'}", tuyệt đối không rập khuôn, mang lại sự nguyên bản trọn vẹn.`,
      `Tác giả làm chủ tuyệt đối không gian tư duy qua đoạn "${'{originalPhrase}'}", dũng cảm bứt phá mọi khuôn mẫu.`,
      `Sự tự tin và độc bản qua câu "${'{originalPhrase}'}" tạo ra sức hút độc nhất vô nhị cho toàn bài.`,
      `Tính nguyên bản tuyệt đối minh chứng qua câu "${'{originalPhrase}'}" là thành quả của tư duy tự lực đỉnh cao.`,
      `Góc nhìn cá nhân sắc sảo tại đoạn "${'{originalPhrase}'}", tự chủ hoàn toàn trước mọi áp lực khắt khe.`,
      `Sự phóng khoáng thể hiện qua ý "${'{originalPhrase}'}" giúp bài làm tỏa sáng rực rỡ sức sống riêng.`,
      `Tác giả thể hiện cái tôi học thuật mạnh mẽ và vô cùng vững chãi qua đoạn "${'{originalPhrase}'}".`,
      `Tính độc lập nhận thức đạt đỉnh cao qua câu "${'{originalPhrase}'}", hoàn toàn miễn nhiễm với lối mòn.`,
      `Dấu ấn cá nhân sắc nét qua đoạn "${'{originalPhrase}'}" khép lại khung tư duy độc lập một cách kiêu hãnh.`,
    ],
  },
  {
    weak: [
      `Cấu trúc tổng thể sụp đổ tại đoạn "${'{flawedSection}'}" do thiếu tư duy bao quát và mạch lập luận đứt gãy.`,
      `Mạch lập luận đứt gãy liên tục, minh chứng cụ thể qua sự bất ổn của phân đoạn "${'{flawedSection}'}".`,
      `Tính hệ thống toàn cục không tồn tại, các phần liên kết lỏng lẻo lộ rõ ở đoạn "${'{flawedSection}'}".`,
      `Sự yếu kém trong điều phối cấu trúc tại đoạn "${'{flawedSection}'}" làm sụt giảm nghiêm trọng chất lượng bài làm.`,
      `Không duy trì được phong độ, cấu trúc bài viết chệch choạc thấy rõ tại phân đoạn "${'{flawedSection}'}".`,
      `Sự thiếu chuẩn mực trong sơ đồ tư duy phản ánh qua đoạn "${'{flawedSection}'}" khiến bài làm trở thành khối hỗn độn.`,
      `Khung phân tích nội dung sụp đổ tại đoạn "${'{flawedSection}'}" trước các yêu cầu logic cơ bản.`,
      `Mạch văn đứt đoạn ở đoạn "${'{flawedSection}'}", không thể tạo ra hệ thống kiến trúc luận điểm hoàn chỉnh.`,
      `Sự lỏng lẻo trong khớp nối ý tưởng tại đoạn "${'{flawedSection}'}" làm bài viết mất đi sức nặng.`,
      `Cấu trúc tổng thể kém vững chắc, khép lại ở đoạn "${'{flawedSection}'}" với nhiều điểm trừ lớn.`,
    ],
    medium: [
      `Cấu trúc tổng thể duy trì sự ổn định, các phần liên kết trọn vẹn thể hiện qua đoạn "${'{connectedSection}'}".`,
      `Khung xương sống vững vàng vừa đủ, không xảy ra sụp đổ lớn minh chứng ở đoạn "${'{connectedSection}'}".`,
      `Tính logic toàn cục đạt mức trung bình, bảo đảm sự mạch lạc qua cách nối ý tại đoạn "${'{connectedSection}'}".`,
      `Sự đồng bộ trong cấu trúc triển khai đáp ứng tốt tiêu chuẩn chung, phản ánh qua đoạn "${'{connectedSection}'}".`,
      `Mạch văn trôi chảy ở mức an toàn, không có điểm nghẽn nghiêm trọng tại phân đoạn "${'{connectedSection}'}".`,
      `Hệ thống lập luận khép kín tương đối, thể hiện qua nỗ lực điều phối cấu trúc ở đoạn "${'{connectedSection}'}".`,
      `Cấu trúc đạt chuẩn mực cơ bản, rành mạch và dễ theo dõi qua cách triển khai tại đoạn "${'{connectedSection}'}".`,
      `Sự ăn khớp giữa các phần đạt mức khá, giữ phong độ ổn định xuyên suốt đoạn "${'{connectedSection}'}".`,
      `Khung phân tích hoàn thành tốt nhiệm vụ kết nối ý tưởng qua phân đoạn "${'{connectedSection}'}".`,
      `Tính thống nhất toàn cục bảo toàn tốt ở mức độ chấp nhận được thông qua đoạn "${'{connectedSection}'}".`,
    ],
    good: [
      `Cấu trúc tổng thể vô cùng kiên cố, hoàn hảo và đạt độ hoàn thiện cao minh chứng qua đoạn "${'{solidSection}'}".`,
      `Mạch lập luận liền mạch từ đầu tới cuối, tạo khối kiến trúc tư duy vững chãi kết tinh ở đoạn "${'{solidSection}'}".`,
      `Tính hệ thống toàn cục xuất sắc, các khớp nối ý tưởng khớp đến từng chi tiết tại đoạn "${'{solidSection}'}".`,
      `Sự vững vàng trong cấu trúc tư duy qua đoạn "${'{solidSection}'}" là minh chứng cho năng lực bao quát tuyệt vời.`,
      `Hệ thống luận điểm khép kín, logic tuyệt đối và cực kỳ kiên cố thể hiện qua đoạn "${'{solidSection}'}".`,
      `Sự đồng bộ hoàn hảo trong cấu trúc triển khai qua đoạn "${'{solidSection}'}" tạo sức mạnh thuyết phục tối đa.`,
      `Khung phân tích nội dung đạt chuẩn vàng về tư duy hệ thống và cấu trúc học thuật qua đoạn "${'{solidSection}'}".`,
      `Tác giả điều phối toàn bộ bài viết trơn tru, minh chứng rõ nét qua phân đoạn kết nối "${'{solidSection}'}".`,
      `Tính toàn vẹn của cấu trúc lập luận khẳng định trưởng thành vượt bậc qua đoạn "${'{solidSection}'}".`,
      `Khung nội dung khép lại trong sự thán phục về độ chặt chẽ thể hiện qua phân đoạn "${'{solidSection}'}".`,
    ],
  },
];

// --- Frame 2: Khả năng diễn đạt & Từ vựng ---
const FRAME2: TieredFrame = [
  {
    weak: [
      `Mật độ từ vựng nghèo nàn (${'{uniqueWords}'}/${'{totalWords}'} từ), lặp lại vô nghĩa từ "${'{repeatedWords}'}" liên tục gây nhàm chán.`,
      `Vốn từ quá hạn chế (${'{uniqueWords}'}/${'{totalWords}'} từ độc bản); việc lạm dụng từ "${'{repeatedWords}'}" tố cáo sự nghèo nàn biểu đạt.`,
      `Tần suất từ ngữ lặp lại cao (${'{uniqueWords}'}/${'{totalWords}'} từ), đặc biệt việc bám lấy từ "${'{repeatedWords}'}" làm văn phong khô khốc.`,
      `Độ phủ từ vựng thấp kém (${'{uniqueWords}'}/${'{totalWords}'} từ), không đủ sức gánh vác ý tưởng khi cứ lặp lại từ "${'{repeatedWords}'}".`,
      `Sự nghèo nàn về từ ngữ (${'{uniqueWords}'}/${'{totalWords}'} từ) cùng thói quen lặp từ "${'{repeatedWords}'}" làm lu mờ nội dung bài làm.`,
      `Khoảng trống ngôn từ lớn (${'{uniqueWords}'}/${'{totalWords}'} từ), lạm dụng từ thông dụng như "${'{repeatedWords}'}" một cách vô nghĩa.`,
      `Tỷ lệ từ độc lập quá thấp (${'{uniqueWords}'}/${'{totalWords}'} từ), vốn từ bị thu hẹp trầm trọng qua các lỗi lặp từ như "${'{repeatedWords}'}".`,
      `Sự thiếu hụt từ vựng chuyên môn (${'{uniqueWords}'}/${'{totalWords}'} từ) cộng thêm việc dùng quẩn quanh từ "${'{repeatedWords}'}" làm bài hời hợt.`,
      `Mật độ từ vựng yếu kém (${'{uniqueWords}'}/${'{totalWords}'} từ) phản ánh qua việc lặp từ "${'{repeatedWords}'}" sự suy giảm năng lực ngôn ngữ.`,
      `Thống kê từ vựng bết bát (${'{uniqueWords}'}/${'{totalWords}'} từ) khép lại phần biểu đạt với điểm trừ lớn từ việc lặp từ "${'{repeatedWords}'}".`,
    ],
    medium: [
      `Mật độ từ vựng đạt mức trung bình (${'{uniqueWords}'}/${'{totalWords}'} từ), các từ khóa như "${'{standardWords}'}" làm tròn nhiệm vụ biểu đạt cơ bản.`,
      `Thống kê ghi nhận ${'{uniqueWords}'} từ độc lập trên tổng ${'{totalWords}'} từ; việc sử dụng từ "${'{standardWords}'}" giữ mạch văn an toàn.`,
      `Vốn từ ở mức tròn vai (${'{uniqueWords}'}/${'{totalWords}'} từ), từ khóa "${'{standardWords}'}" đáp ứng yêu cầu biểu đạt cơ bản.`,
      `Độ bao phủ từ vựng đạt ${'{uniqueWords}'}/${'{totalWords}'} từ, có cố gắng chắt lọc qua các từ như "${'{standardWords}'}" nhưng chưa đột phá.`,
      `Tần suất từ ngữ đạt ${'{uniqueWords}'}/${'{totalWords}'} từ, sự xuất hiện của từ "${'{standardWords}'}" giữ được sự trôi chảy tương đối.`,
      `Sự phân bổ ${'{uniqueWords}'} từ độc bản trên tổng ${'{totalWords}'} từ cùng từ "${'{standardWords}'}" phản ánh mức độ từ vựng ổn định.`,
      `Lượng từ vựng đủ dùng (${'{uniqueWords}'}/${'{totalWords}'} từ), từ khóa "${'{standardWords}'}" không quá nghèo nàn nhưng thiếu điểm nhấn.`,
      `Tỷ lệ từ ngữ độc lập đạt ${'{uniqueWords}'}/${'{totalWords}'} từ, thông qua từ "${'{standardWords}'}" bảo đảm tính rõ nghĩa cho văn bản.`,
      `Độ dày từ vựng ở mức khá (${'{uniqueWords}'}/${'{totalWords}'} từ), phản ánh qua từ "${'{standardWords}'}" quá trình huy động từ tương đối.`,
      `Mật độ ngôn từ đạt chuẩn trung bình (${'{uniqueWords}'}/${'{totalWords}'} từ) nhờ điểm tựa từ vựng từ khóa "${'{standardWords}'}".`,
    ],
    good: [
      `Mật độ từ vựng vô cùng phong phú (${'{uniqueWords}'}/${'{totalWords}'} từ độc bản), thăng hoa qua các từ đắt giá như "${'{richVocabulary}'}".`,
      `Thống kê ghi nhận ${'{uniqueWords}'} từ độc lập xuất sắc trên tổng ${'{totalWords}'} từ, bùng nổ qua lớp từ vựng như "${'{richVocabulary}'}".`,
      `Vốn từ đa dạng và đẳng cấp (${'{uniqueWords}'}/${'{totalWords}'} từ), tạo sức hút qua việc huy động các từ tinh tế như "${'{richVocabulary}'}".`,
      `Độ bao phủ tuyệt vời (${'{uniqueWords}'}/${'{totalWords}'} từ), đầu tư ngôn từ nghiêm túc qua các từ sắc sảo như "${'{richVocabulary}'}".`,
      `Tần suất từ mới sáng tạo đạt ${'{uniqueWords}'}/${'{totalWords}'} từ, làm bừng sáng văn bản nhờ cụm từ như "${'{richVocabulary}'}".`,
      `Sự góp mặt của ${'{uniqueWords}'} từ độc bản trên tổng ${'{totalWords}'} từ, tiêu biểu như từ "${'{richVocabulary}'}" nâng tầm học thuật rõ rệt.`,
      `Lượng từ vựng phong phú, đắt giá (${'{uniqueWords}'}/${'{totalWords}'} từ) qua cách chắt lọc tuyệt vời từ "${'{richVocabulary}'}".`,
      `Tỷ lệ từ ngữ độc lập đạt ngưỡng cao (${'{uniqueWords}'}/${'{totalWords}'} từ), biểu đạt sắc thái tinh tế qua từ "${'{richVocabulary}'}".`,
      `Độ dày từ vựng vượt trội (${'{uniqueWords}'}/${'{totalWords}'} từ) kết tinh qua các lựa chọn từ ngữ đỉnh cao như "${'{richVocabulary}'}".`,
      `Mật độ từ vựng đỉnh cao (${'{uniqueWords}'}/${'{totalWords}'} từ) khép lại phần biểu đạt kiêu hãnh với từ "${'{richVocabulary}'}".`,
    ],
  },
  {
    weak: [
      `Cấu trúc câu đơn điệu, lộ rõ sự ngang phè qua mẫu câu lủng củng như "${'{awkwardSentence}'}".`,
      `Câu văn cụt lủn, ngắt nhịp sai chỗ minh chứng qua mẫu câu "${'{awkwardSentence}'}", làm đứt gãy mạch cảm xúc.`,
      `Lạm dụng câu dài lê thê khiến người đọc ngộp thở, điển hình là câu lỗi cấu trúc "${'{awkwardSentence}'}".`,
      `Nhịp điệu hành văn hỗn loạn, thiếu kiểm soát cú pháp thể hiện rõ qua câu "${'{awkwardSentence}'}".`,
      `Sai lỗi ngữ pháp liên tục, cấu trúc câu phức hợp bị rối loạn nghiêm trọng ở câu "${'{awkwardSentence}'}".`,
      `Sự thô cứng trong cách xếp đặt vế câu minh chứng qua câu "${'{awkwardSentence}'}" làm bài mất đi sự uyển chuyển.`,
      `Câu chữ rườm rà, thừa thãi, thể hiện sự cẩu thả trong cú pháp qua câu "${'{awkwardSentence}'}".`,
      `Nhịp điệu đứt đoạn, câu văn thiếu liên kết biểu hiện rõ ở mẫu câu "${'{awkwardSentence}'}".`,
      `Cấu trúc cú pháp nghèo nàn, toàn bài xoay quanh các câu đơn đơn giản như "${'{awkwardSentence}'}".`,
      `Sự lủng củng trong diễn đạt khép lại qua câu "${'{awkwardSentence}'}" với nhiều hạt sạn cú pháp lớn.`,
    ],
    medium: [
      `Cấu trúc câu ổn định, sử dụng đan xen hợp lý minh chứng qua cách ngắt nhịp ở câu "${'{normalSentence}'}".`,
      `Nhịp điệu câu văn trôi chảy tương đối, bảo đảm sự rành mạch thông điệp qua mẫu câu "${'{normalSentence}'}".`,
      `Tác giả kiểm soát độ dài câu tương đối tốt, không có lỗi ngữ pháp lớn xuất hiện ở câu "${'{normalSentence}'}".`,
      `Sự biến đổi mẫu câu ở mức an toàn, giữ nhịp đọc đều đặn thể hiện qua câu "${'{normalSentence}'}".`,
      `Cú pháp rõ ràng, rành mạch thể hiện sự cẩn trọng trong quá trình viết qua câu "${'{normalSentence}'}".`,
      `Nhịp điệu hành văn tròn vai, không quá thô cứng, minh chứng qua câu mẫu "${'{normalSentence}'}".`,
      `Các vế câu liên kết hợp lý, tạo dòng chảy thông tin cơ bản biểu hiện ở câu "${'{normalSentence}'}".`,
      `Tác giả nắm vững quy tắc cấu trúc câu qua cách triển khai trọn vẹn tại câu "${'{normalSentence}'}".`,
      `Mẫu câu phong phú ở mức trung bình, giúp văn bản giữ sự mạch lạc qua câu "${'{normalSentence}'}".`,
      `Nhịp điệu câu chữ đều đặn, khép lại phần cấu trúc ở mức độ chấp nhận được qua câu "${'{normalSentence}'}".`,
    ],
    good: [
      `Cấu trúc câu vô cùng biến hóa, đan xen linh hoạt tạo nhịp điệu uyển chuyển như thơ qua câu "${'{fluidSentence}'}".`,
      `Câu văn sắc sảo, gãy gọn, mỗi nhịp ngắt nghỉ mang sức nặng thâm thúy minh chứng ở câu "${'{fluidSentence}'}".`,
      `Sự làm chủ cú pháp xuất sắc, phối hợp nhịp nhàng thể hiện đỉnh cao qua câu "${'{fluidSentence}'}".`,
      `Nhịp điệu hành văn hào sảng, cuốn hút, dẫn dắt người đọc qua câu văn nghệ thuật "${'{fluidSentence}'}".`,
      `Cấu trúc phức hợp sử dụng cực kỳ chuẩn xác, nâng tầm học thuật toàn diện qua câu "${'{fluidSentence}'}".`,
      `Sự tinh tế trong cách gọt giũa từng vế câu tạo nên tác phẩm văn chương đúng nghĩa qua câu "${'{fluidSentence}'}".`,
      `Nhịp điệu câu chữ biến hóa khôn lường, thể hiện tay nghề hành văn đỉnh cao ở câu "${'{fluidSentence}'}".`,
      `Câu chữ giàu hình ảnh, nhịp nhàng và tràn đầy năng lượng nghệ thuật sống động qua câu "${'{fluidSentence}'}".`,
      `Sự hoàn mỹ trong cấu trúc cú pháp khẳng định sự thông thạo tuyệt đối qua câu "${'{fluidSentence}'}".`,
      `Nhịp điệu biểu đạt đỉnh cao khép lại khung diễn đạt bằng dư âm ngọt ngào từ câu "${'{fluidSentence}'}".`,
    ],
  },
  {
    weak: [
      `Giọng văn cứng nhắc, giả tạo, lộ rõ sự gượng gạo qua cách dùng từ "${'{forcedVocabulary}'}" đậm chất máy móc.`,
      `Sắc thái biểu đạt nhợt nhạt, vô hồn, minh chứng qua cách hành văn ngượng ngùng tại cụm "${'{forcedVocabulary}'}".`,
      `Văn phong lủng củng, pha tạp nhiều lớp ngôn ngữ lạ lẫm qua việc cố dùng từ "${'{forcedVocabulary}'}".`,
      `Giọng điệu yếu ớt, thiếu bản lĩnh, đọc lên thấy rõ sự gượng gạo tại cụm từ "${'{forcedVocabulary}'}".`,
      `Sự cẩu thả trong chọn từ phai mờ nét đẹp chuẩn mực, biểu hiện qua cách dùng từ "${'{forcedVocabulary}'}".`,
      `Văn phong bệ rạc, thiếu trang trọng cần thiết, đặc biệt ở lối biểu đạt gượng ép như "${'{forcedVocabulary}'}".`,
      `Giọng điệu lộn xộn, không giữ được sự nhất quán, lộ rõ qua cụm từ lệch chuẩn "${'{forcedVocabulary}'}".`,
      `Sự gượng gạo bao trùm toàn bài, tố cáo qua cụm từ "${'{forcedVocabulary}'}" sự thiếu tự nhiên trong hành văn.`,
      `Màu sắc ngôn ngữ nghèo nàn, thiếu sức sống qua cách diễn đạt gượng ép tại từ "${'{forcedVocabulary}'}".`,
      `Văn phong kém chất lượng khép lại phần biểu đạt với sự thất vọng lớn từ cách dùng từ "${'{forcedVocabulary}'}".`,
    ],
    medium: [
      `Văn phong giữ được độ trong sáng cơ bản, trang trọng minh chứng qua cách diễn đạt "${'{clearExpression}'}".`,
      `Sắc thái biểu đạt tự nhiên vừa đủ, không gượng gạo, thể hiện qua cụm từ "${'{clearExpression}'}".`,
      `Giọng văn chững chạc ở mức an toàn, phản ánh qua câu "${'{clearExpression}'}" thái độ làm bài nghiêm túc.`,
      `Sự hài hòa trong màu sắc ngôn ngữ giúp bài viết giữ thiện cảm qua cách dùng từ "${'{clearExpression}'}".`,
      `Văn phong rành mạch, rõ ràng, không pha tạp qua cách biểu đạt chuẩn mực như "${'{clearExpression}'}".`,
      `Giọng điệu ổn định, giữ khoảng cách chuẩn mực của bài nghị luận thông qua câu "${'{clearExpression}'}".`,
      `Sự tự nhiên trong nhịp hành văn tạo cảm giác dễ chịu, minh chứng ở cụm "${'{clearExpression}'}".`,
      `Màu sắc ngôn ngữ ở mức tròn vai, phản ánh qua câu "${'{clearExpression}'}" năng lực biểu đạt phổ thông.`,
      `Văn phong không có điểm trừ lớn, duy trì sự bình ổn xuyên suốt nhờ cách viết "${'{clearExpression}'}".`,
      `Giọng điệu trung tính, khép lại phần phong cách ở mức độ chấp nhận được qua câu "${'{clearExpression}'}".`,
    ],
    good: [
      `Văn phong trong sáng, hào sảng, đậm chất học thuật hiện đại thể hiện qua câu "${'{elegantSentence}'}".`,
      `Sắc thái biểu đạt tinh tế, giàu cảm xúc, chạm đến tận cùng tâm can qua câu văn "${'{elegantSentence}'}".`,
      `Giọng văn đĩnh đạc, kiêu hãnh và tràn đầy bản lĩnh khẳng định qua câu "${'{elegantSentence}'}".`,
      `Sự hòa quyện tuyệt vời giữa chuẩn mực và cá tính tạo nên phong cách độc bản ở câu "${'{elegantSentence}'}".`,
      `Văn phong sắc bén, lạnh lùng của tư duy logic nhưng vẫn ấm áp tình người qua câu "${'{elegantSentence}'}".`,
      `Giọng điệu cuốn hút, có sức mạnh lay động tâm trí cực kỳ mạnh mẽ qua câu "${'{elegantSentence}'}".`,
      `Màu sắc ngôn ngữ phong phú, sang trọng, nâng tầm giá trị toàn bộ công trình qua câu "${'{elegantSentence}'}".`,
      `Sự tự nhiên thăng hoa trong từng câu chữ khẳng định qua câu "${'{elegantSentence}'}" đẳng cấp vượt trội.`,
      `Văn phong đỉnh cao, trong trẻo và sáng ngời tinh thần độc lập sáng tạo biểu hiện ở câu "${'{elegantSentence}'}".`,
      `Giọng văn xuất sắc khép lại khung phong cách bằng dấu ấn không thể phai mờ qua câu "${'{elegantSentence}'}".`,
    ],
  },
  {
    weak: [
      `Lạm dụng thuật ngữ bừa bãi, dùng sai sắc thái nghĩa điển hình như cụm từ "${'{misusedTerm}'}" gây hiểu lầm.`,
      `Từ ngữ thô thiển, chắp vá, hoàn toàn thiếu tinh tế minh chứng qua lỗi dùng từ "${'{misusedTerm}'}".`,
      `Sai lỗi chính tả và dùng từ lóng lệch chuẩn trong văn bản học thuật, tiêu biểu như từ "${'{misusedTerm}'}".`,
      `Sự ngô nghê trong cách gọi tên sự vật tố cáo qua cụm "${'{misusedTerm}'}" vốn hiểu biết hạn hẹp.`,
      `Dùng từ đao búa rỗng tuếch nhưng sai ngữ cảnh như trường hợp của "${'{misusedTerm}'}", lộ rõ tính hình thức lố bịch.`,
      `Sự cẩu thả trong từng nét chữ làm mất giá trị chuyên môn, điển hình ở từ "${'{misusedTerm}'}".`,
      `Không xác định hệ thống từ khóa, dùng từ mơ hồ như cụm "${'{misusedTerm}'}", đánh tráo khái niệm liên tục.`,
      `Sự bất cẩn trong chọn lọc thuật ngữ minh chứng qua từ "${'{misusedTerm}'}" làm sụp đổ hệ thống lý luận.`,
      `Từ ngữ nghèo nàn, lặp lại các từ thông dụng kém duyên như trường hợp của "${'{misusedTerm}'}".`,
      `Sự sai sót hệ thống thuật ngữ khép lại khung ngôn từ với hạt sạn lớn tại từ "${'{misusedTerm}'}".`,
    ],
    medium: [
      `Thuật ngữ sử dụng đúng chỗ, bảo đảm tính chính xác cơ bản qua từ khóa "${'{properTerm}'}".`,
      `Sự cẩn trọng trong chọn từ giúp các khái niệm truyền tải rõ nghĩa nhờ thuật ngữ "${'{properTerm}'}".`,
      `Không có lỗi dùng từ sai nghiêm trọng, thể hiện qua việc vận hành thuật ngữ "${'{properTerm}'}".`,
      `Hệ thống từ khóa cơ bản được phân bổ hợp lý trong suốt bài viết, tiêu biểu như từ "${'{properTerm}'}".`,
      `Sự tinh tế ở mức trung bình, từ ngữ đáp ứng đúng yêu cầu thông qua thuật ngữ "${'{properTerm}'}".`,
      `Độ chuẩn xác thuật ngữ đạt chuẩn quy định nhờ việc sử dụng chính xác từ "${'{properTerm}'}".`,
      `Tác giả nắm vững các khái niệm cốt lõi, diễn đạt rành mạch thông qua từ khóa "${'{properTerm}'}".`,
      `Sự chỉn chu trong lựa chọn từ khóa giúp bài làm giữ độ tin cậy nhờ thuật ngữ "${'{properTerm}'}".`,
      `Không xuất hiện từ ngữ lệch chuẩn, duy trì sự an toàn thông qua việc chọn từ như "${'{properTerm}'}".`,
      `Tính chuẩn xác ngôn từ khép lại ở mức tròn vai nhờ việc đặt đúng vị trí từ "${'{properTerm}'}".`,
    ],
    good: [
      `Hệ thống thuật ngữ chuyên ngành sử dụng cực kỳ chuẩn xác, đắt giá minh chứng qua cụm "${'{preciseTerm}'}".`,
      `Sự sắc sảo trong chọn từ biến khái niệm khô khan thành điểm sáng rực rỡ nhờ thuật ngữ "${'{preciseTerm}'}".`,
      `Tác giả làm chủ hoàn toàn lớp nghĩa, dùng từ đúng thời điểm thần kỳ tiêu biểu như cụm "${'{preciseTerm}'}".`,
      `Sự cẩn trọng đến từng nét chữ khẳng định qua thuật ngữ "${'{preciseTerm}'}" thái độ học thuật đỉnh cao.`,
      `Mỗi từ ngữ xuất hiện đều mang sức nặng ngàn cân, chốt hạ vấn đề đanh thép qua từ "${'{preciseTerm}'}".`,
      `Sự tinh tế tuyệt đối trong biểu đạt thông điệp truyền tải vẹn nguyên nhờ cụm từ "${'{preciseTerm}'}".`,
      `Hệ thống thuật ngữ hoàn hảo, chuẩn mực khoa học tạo niềm tin tuyệt đối qua từ "${'{preciseTerm}'}".`,
      `Sự đắt giá của các từ đắt xắt ra miếng làm bừng sáng bài viết tiêu biểu như cụm "${'{preciseTerm}'}".`,
      `Tác giả vận dụng từ vựng như bậc thầy ngôn ngữ, sắc bén qua thuật ngữ chuyên sâu "${'{preciseTerm}'}".`,
      `Tính chuẩn xác đỉnh cao khép lại khung thuật ngữ bằng sự thán phục tuyệt đối tại cụm "${'{preciseTerm}'}".`,
    ],
  },
  {
    weak: [
      `Tổng thể ngôn từ rối rắm, khung diễn đạt sụp đổ hoàn toàn về mặt thẩm mỹ do thiếu sự gọt giũa.`,
      `Sự chắp vá cẩu thả làm phá hủy toàn bộ lớp áo ngôn ngữ, để lại bức tranh văn bản thô kệch.`,
      `Không có sự đồng bộ giữa từ vựng và cú pháp, tạo ra sản phẩm ngôn từ lủng củng, kém chất lượng.`,
      `Khung ngôn từ bất ổn, lộ rõ sự bất lực trong việc điều phối câu chữ từ người làm bài.`,
      `Sự yếu kém toàn diện trong biểu đạt khép lại phần ngôn ngữ với điểm số rất thấp.`,
      `Tính thẩm mỹ văn bản không tồn tại, dày đặc các lỗi diễn đạt thô thiển từ đầu tới cuối.`,
      `Sự đứt gãy trong dòng chảy ngôn từ làm người đọc cảm thấy vô cùng khó chịu và mệt mỏi.`,
      `Khung diễn đạt kém chất lượng, phá hỏng hoàn toàn ý tưởng ban đầu vô cùng đáng tiếc.`,
      `Sự thất bại trong khâu gọt giũa ngôn từ tố cáo sự cẩu thả của người viết trong bài làm.`,
      `Tổng thể ngôn ngữ lộn xộn, khép lại khung 2 trong sự hụt hẫng lớn về mặt hình thức.`,
    ],
    medium: [
      `Tổng thể ngôn từ đạt mức tròn vai, khung diễn đạt vận hành ổn định và an toàn.`,
      `Sự đồng bộ cơ bản giữa từ vựng và cấu trúc giúp bài làm hoàn thành nhiệm vụ truyền tải.`,
      `Khung ngôn ngữ không có điểm sáng đột phá nhưng đáp ứng đủ tiêu chuẩn tối thiểu.`,
      `Tính thẩm mỹ văn bản đạt mức trung bình, giữ được sự rành mạch cần thiết cho thông điệp.`,
      `Dòng chảy biểu đạt trôi chảy tương đối, mang lại cảm giác dễ chịu khi tiếp nhận thông tin.`,
      `Sự kết hợp các yếu tố hình thức ở mức tròn trịa, không gặp lỗi hệ thống nghiêm trọng nào.`,
      `Khung diễn đạt hoàn thành tốt nhiệm vụ chuyển hóa ý tưởng tư duy thành văn bản.`,
      `Tính nhất quán trong phong cách hành văn được bảo toàn ở mức chấp nhận được.`,
      `Tổng thể ngôn từ đạt yêu cầu cơ bản của một bài nghị luận phổ thông chuẩn mực.`,
      `Khung 2 khép lại trong sự ổn định và an toàn tuyệt đối về mặt hình thức biểu đạt.`,
    ],
    good: [
      `Tổng thể bức tranh ngôn từ đạt đến độ chín muồi hoàn hảo, đẹp đẽ và đầy tính nghệ thuật.`,
      `Khung diễn đạt vận hành trơn tru như dòng suối mát, mượt mà và vô cùng cuốn hút.`,
      `Sự đồng bộ đỉnh cao giữa sắc thái từ vựng và nhịp điệu câu chữ tạo nên kiệt tác nhỏ.`,
      `Toàn bộ hệ thống biểu đạt thăng hoa rực rỡ, không có bất kỳ điểm nghẽn cú pháp nào.`,
      `Sự trau chuốt toàn diện giúp khung ngôn ngữ đạt chuẩn mực thẩm mỹ cao nhất.`,
      `Tác giả biến ngôn từ thành vũ khí tối thượng, chuyển hóa tư duy sắc bén thành nghệ thuật.`,
      `Khung diễn đạt khép lại trong sự ngỡ ngàng về năng lực làm chủ tiếng mẹ đẻ xuất sắc.`,
      `Tính thẩm mỹ và chuẩn mực học thuật hòa quyện tuyệt vời trong khung ngôn ngữ này.`,
      `Tổng thể ngôn từ đạt đỉnh cao của sự cân bằng giữa logic sắc bén và nghệ thuật chữ nghĩa.`,
      `Sự hoàn mỹ tuyệt đối khép lại khung số 2 một cách đầy kiêu hãnh và rực rỡ.`,
    ],
  },
];

// --- Frame 3: Tính sáng tạo & Lời khuyên ---
const FRAME3: TieredFrame = [
  {
    weak: [
      `Tốc độ xử lý quá chậm chạp (${'{wpm}'} từ/phút); phản xạ tư duy bị trì trệ thể hiện rõ qua sự bế tắc tại đoạn "${'{stalledSegment}'}".`,
      `Vận tốc thao tác bất thường (${'{wpm}'} từ/phút), lộ rõ sự mất phương hướng khi gõ đoạn "${'{stalledSegment}'}".`,
      `Nhịp độ quá thấp (${'{wpm}'} từ/phút) cho thấy sự chật vật khi tự lực hoàn thành đoạn viết "${'{stalledSegment}'}".`,
      `Tốc độ gõ phím đình trệ (${'{wpm}'} từ/phút), đứt quãng liên tục do thiếu ý tưởng trầm trọng tại đoạn "${'{stalledSegment}'}".`,
      `Vận tốc ${'{wpm}'} từ/phút phản ánh tâm lý hoang mang, áp lực đè nặng khi đối diện với phân đoạn "${'{stalledSegment}'}".`,
      `Tần suất thao tác kém hiệu quả (${'{wpm}'} từ/phút), không kiểm soát được thời gian triển khai ý tại đoạn "${'{stalledSegment}'}".`,
      `Nhịp độ suy giảm thấy rõ (${'{wpm}'} từ/phút), minh chứng cho sự đuối sức toàn tập khi xử lý đoạn "${'{stalledSegment}'}".`,
      `Tốc độ bất thường (${'{wpm}'} từ/phút) đi kèm chất lượng thấp thể hiện qua sự lúng túng ở đoạn "${'{stalledSegment}'}".`,
      `Vận tốc xử lý trì trệ (${'{wpm}'} từ/phút) làm lỡ dở nhịp điệu logic của toàn bộ bài làm tại đoạn "${'{stalledSegment}'}".`,
      `Hiệu suất tốc độ kém (${'{wpm}'} từ/phút) khép lại phần đo lường với nhiều lo ngại tại phân đoạn "${'{stalledSegment}'}".`,
    ],
    medium: [
      `Tốc độ xử lý ổn định (${'{wpm}'} từ/phút), giữ nhịp độ vừa vặn khi triển khai đoạn văn "${'{decentSegment}'}".`,
      `Vận tốc thao tác đạt mức ${'{wpm}'} từ/phút, phản xạ tư duy an toàn minh chứng qua cách hoàn thành đoạn "${'{decentSegment}'}".`,
      `Nhịp độ làm việc ${'{wpm}'} từ/phút cho thấy sự tập trung và kiểm soát thời gian tốt ở đoạn "${'{decentSegment}'}".`,
      `Tốc độ thao tác đạt ${'{wpm}'} từ/phút, giúp học sinh duy trì dòng suy nghĩ trôi chảy tại đoạn "${'{decentSegment}'}".`,
      `Vận tốc ${'{wpm}'} từ/phút phản ánh nhịp gõ đều đặn, không bị áp lực thời gian chi phối ở đoạn "${'{decentSegment}'}".`,
      `Tốc độ ổn định (${'{wpm}'} từ/phút) tạo bệ phóng an toàn cho quá trình hoàn thành đoạn "${'{decentSegment}'}".`,
      `Nhịp độ thao tác đạt ${'{wpm}'} từ/phút, thể hiện sự phân bổ thời gian hợp lý qua phân đoạn "${'{decentSegment}'}".`,
      `Vận tốc ghi nhận ${'{wpm}'} từ/phút, bảo đảm sự bình tĩnh cần thiết khi xử lý đoạn "${'{decentSegment}'}".`,
      `Tốc độ xử lý đạt chuẩn (${'{wpm}'} từ/phút), phản ánh nhịp độ làm bài chắc chắn tại đoạn "${'{decentSegment}'}".`,
      `Hiệu suất tốc độ đạt mức tròn vai (${'{wpm}'} từ/phút), giữ vững phong độ ổn định ở đoạn "${'{decentSegment}'}".`,
    ],
    good: [
      `Tốc độ xử lý chớp nhoáng (${'{wpm}'} từ/phút) đi kèm sự bùng nổ ý tưởng xuất sắc tại đoạn "${'{brilliantSegment}'}".`,
      `Vận tốc thao tác ấn tượng (${'{wpm}'} từ/phút) chứng tỏ phản xạ tư duy vô cùng đáng nể khi viết đoạn "${'{brilliantSegment}'}".`,
      `Nhịp độ gõ phím tốc độ cao (${'{wpm}'} từ/phút) kết hợp tư duy sắc bén thăng hoa tại đoạn "${'{brilliantSegment}'}".`,
      `Tốc độ xử lý đỉnh cao (${'{wpm}'} từ/phút), làm chủ hoàn toàn thời gian thể hiện qua đoạn "${'{brilliantSegment}'}".`,
      `Vận tốc ${'{wpm}'} từ/phút minh chứng cho sự tự tin tuyệt đối và dòng tư duy tuôn trào ở đoạn "${'{brilliantSegment}'}".`,
      `Tốc độ thao tác xuất sắc (${'{wpm}'} từ/phút), phản xạ linh hoạt qua phân đoạn sáng tạo "${'{brilliantSegment}'}".`,
      `Nhịp độ làm việc cực kỳ hiệu quả (${'{wpm}'} từ/phút), khẳng định phong độ đỉnh cao tại đoạn "${'{brilliantSegment}'}".`,
      `Vận tốc ghi nhận ${'{wpm}'} từ/phút, phản ánh năng lực tư duy nhanh nhạy và sắc bén ở đoạn "${'{brilliantSegment}'}".`,
      `Tốc độ xử lý vượt trội (${'{wpm}'} từ/phút), kiến tạo nên không gian lập luận bùng nổ tại đoạn "${'{brilliantSegment}'}".`,
      `Hiệu suất tốc độ hoàn hảo (${'{wpm}'} từ/phút) khép lại phần đo lường bằng chiến thắng vang dội ở đoạn "${'{brilliantSegment}'}".`,
    ],
  },
  {
    weak: [
      `Tư duy đang rơi vào lối mòn bế tắc; đoạn văn "${'{clicheSegment}'}" phản ánh sự rập khuôn đáng báo động khi thiếu dũng khí nghĩ khác.`,
      `Sự phụ thuộc vào văn mẫu lộ rõ ở đoạn "${'{clicheSegment}'}"; hãy buông bỏ gậy chống để tự lập luận bằng chính trí tuệ.`,
      `Thiếu vắng tính sáng tạo trầm trọng; ý tưởng tại đoạn "${'{clicheSegment}'}" cho thấy học sinh đang sao chép thụ động.`,
      `Tư duy thiếu bứt phá minh chứng qua đoạn "${'{clicheSegment}'}"; đừng mải đi tìm sự an toàn trong các khuôn mẫu cũ.`,
      `Sự rập khuôn cứng nhắc tại đoạn "${'{clicheSegment}'}" làm thui chột năng lực phản biện độc lập cá nhân.`,
      `Báo động đỏ về sự thiếu sáng tạo qua cách triển khai sáo rỗng ở đoạn "${'{clicheSegment}'}".`,
      `Tư duy lối mòn bao trùm đoạn "${'{clicheSegment}'}"; hãy tập thói quen tự đặt câu hỏi phản biện thay vì lặp lại ý cũ.`,
      `Sự bế tắc trong tưởng tượng phơi bày qua đoạn "${'{clicheSegment}'}"; cần dũng cảm phá vỡ các giới hạn an toàn.`,
      `Không tìm thấy dấu ấn sáng tạo tại đoạn "${'{clicheSegment}'}"; bài làm đang bị đồng hóa vào các khuôn sáo vô hồn.`,
      `Sự rập khuôn tại đoạn "${'{clicheSegment}'}" là lời cảnh tỉnh nghiêm khắc về năng lực tự chủ tư duy.`,
    ],
    medium: [
      `Tư duy bắt đầu có những tia sáng nỗ lực tại đoạn "${'{moderateIdea}'}", tuy nhiên biên độ tìm kiếm góc nhìn mới vẫn còn rụt rè.`,
      `Sự sáng tạo ở mức tròn vai qua ý "${'{moderateIdea}'}"; học sinh cần mạnh dạn mở rộng biên độ liên tưởng hơn nữa.`,
      `Nỗ lực đổi mới cách nhìn xuất hiện ở đoạn "${'{moderateIdea}'}", tuy nhiên cần thêm một chút phóng khoáng để bứt phá.`,
      `Ý tưởng tại đoạn "${'{moderateIdea}'}" có tính thực tế nhưng thiếu những góc nhìn đa chiều táo bạo.`,
      `Sự tìm tòi bắt đầu nhen nhóm qua ý "${'{moderateIdea}'}"; hãy tiếp tục phát huy tinh thần tự chủ này.`,
      `Tư duy ở mức an toàn qua đoạn "${'{moderateIdea}'}"; để tiến xa hơn, em cần vượt qua vùng an toàn lập luận.`,
      `Nỗ lực thoát khỏi lối mòn ghi nhận tại đoạn "${'{moderateIdea}'}", dù độ sắc sảo cần được trau dồi thêm.`,
      `Góc nhìn bắt đầu có nét riêng ở ý "${'{moderateIdea}'}", cần thêm sự dũng cảm để khai thác sâu hơn.`,
      `Sự sáng tạo tiềm ẩn qua đoạn "${'{moderateIdea}'}"; hãy tự tin thể hiện quan điểm cá nhân một cách mạnh mẽ.`,
      `Ý tưởng ổn định tại đoạn "${'{moderateIdea}'}"; đây là nền tảng tốt để phát triển tư duy đột phá trong tương lai.`,
    ],
    good: [
      `Tư duy sáng tạo vượt ngưỡng, góc nhìn độc bản tỏa sáng rực rỡ qua câu "${'{visionarySentence}'}" đầy ấn tượng.`,
      `Sự bùng nổ ý tưởng xuất sắc minh chứng qua câu "${'{visionarySentence}'}", khẳng định năng lực tư duy không giới hạn.`,
      `Tầm nhìn sâu sắc và độc bản thể hiện qua câu "${'{visionarySentence}'}", đánh bại mọi khuôn mẫu lối mòn.`,
      `Sự sáng tạo thăng hoa rực rỡ qua câu "${'{visionarySentence}'}", minh chứng cho bộ óc độc lập đầy bản lĩnh.`,
      `Góc nhìn phản biện đột phá qua câu "${'{visionarySentence}'}" tạo ra giá trị nhận thức vô cùng mới mẻ.`,
      `Sự thông minh và nhạy bén cấu trúc tư duy tỏa sáng rực rỡ qua câu "${'{visionarySentence}'}".`,
      `Tư duy vượt trội minh chứng qua câu "${'{visionarySentence}'}", mở ra không gian tri thức đầy cảm hứng.`,
      `Sự sáng tạo đỉnh cao kết tinh qua câu "${'{visionarySentence}'}", khẳng định bản lĩnh tư duy xuất chúng.`,
      `Ý tưởng táo bạo và sắc sảo qua câu "${'{visionarySentence}'}" mang lại sức sống độc nhất cho toàn bài.`,
      `Tư duy độc bản thăng hoa qua câu "${'{visionarySentence}'}" khép lại khung sáng tạo bằng hào quang rực rỡ.`,
    ],
  },
  {
    weak: [
      `Thầy cần em chấn chỉnh lại gấp cách tiếp cận vấn đề, đặc biệt là sự đứt gãy tư duy tại ý "${'{weakPoint}'}" bằng việc lập dàn ý ra nháp.`,
      `Lời khuyên cho em là hãy ngừng ngay việc lệ thuộc vào văn mẫu, tập trung bóc tách bản chất tại điểm yếu "${'{weakPoint}'}".`,
      `Hãy luyện tập phương pháp ghi âm đọc to để rèn phản xạ cú pháp, khắc phục triệt để lỗi tư duy tại đoạn "${'{weakPoint}'}".`,
      `Cần rà soát lại toàn bộ hệ thống lập luận, bắt đầu bằng việc xây dựng lại luận điểm logic tại ý "${'{weakPoint}'}".`,
      `Bài học rút ra là phải luôn tự đặt câu hỏi phản biện cho chính mình thay vì sa đà vào lỗi sai như ở đoạn "${'{weakPoint}'}".`,
      `Hãy tập thói quen phân rã vấn đề lớn thành các luận điểm nhỏ trước khi viết để tránh vấp ngã tại ý "${'{weakPoint}'}".`,
      `Sự bế tắc ở đoạn "${'{weakPoint}'}" đòi hỏi em phải rèn luyện thêm kỹ năng đọc sâu và tư duy đa chiều.`,
      `Hãy tạm gác các công cụ ngoại biên lại, kiên trì tự viết từng đoạn ngắn để vá lại lỗ hổng tư duy tại "${'{weakPoint}'}".`,
      `Giải pháp cấp bách lúc này là luyện tập viết dàn ý chi tiết để không lặp lại sai lầm ở đoạn "${'{weakPoint}'}".`,
      `Hãy đối diện thẳng thắn với điểm mù tư duy tại đoạn "${'{weakPoint}'}" bằng thái độ cầu thị và kỷ luật nghiêm ngặt.`,
    ],
    medium: [
      `Thầy khuyên em nên dành thêm thời gian gọt giũa các phần như "${'{targetImprovement}'}" để mạch văn có độ lướt thuyết phục hơn.`,
      `Để bứt phá, em cần chú ý rèn luyện thêm khả năng mở rộng liên tưởng tại phân đoạn "${'{targetImprovement}'}".`,
      `Hãy thử áp dụng phương pháp phản biện đa chiều vào các phần tương tự như "${'{targetImprovement}'}" để nâng cao độ sâu.`,
      `Lời khuyên thiết thực là hãy tiết chế các câu văn dài dòng và tập trung gia cố lập luận tại ý "${'{targetImprovement}'}".`,
      `Em đang đi đúng hướng, chỉ cần trau chuốt thêm cách chọn lọc từ khóa ở phần "${'{targetImprovement}'}" là bài viết sẽ hoàn thiện.`,
      `Hãy duy trì thói quen lập dàn ý và chú trọng hơn vào việc liên kết ý tưởng tại phân đoạn "${'{targetImprovement}'}".`,
      `Để văn phong uyển chuyển hơn, hãy thử đọc lại bài làm thành tiếng để tinh chỉnh nhịp điệu tại "${'{targetImprovement}'}".`,
      `Cần tăng cường thêm các dẫn chứng thực tế mang tính xác thực cao cho các phần như "${'{targetImprovement}'}".`,
      `Hãy tiếp tục phát huy nền tảng hiện có và dành thêm thời gian kiểm tra kỹ các mối quan hệ logic ở "${'{targetImprovement}'}".`,
      `Lời khuyên dành cho em là hãy giữ vững sự cẩn trọng và chủ động tinh chỉnh lại đoạn "${'{targetImprovement}'}" cho sắc bén hơn.`,
    ],
    good: [
      `Hãy giữ chặt ngọn lửa nhiệt huyết từ cách lập luận sắc sảo ở đoạn "${'{strongSegment}'}", và sẵn sàng dấn thân vào các bài toán khó hơn.`,
      `Định hướng phát triển tiếp theo là khai thác sâu hơn nữa các góc nhìn triết lý từ nền tảng vững chắc ở đoạn "${'{strongSegment}'}".`,
      `Hãy tiếp tục phát huy tư duy phản biện đỉnh cao đã thể hiện qua đoạn "${'{strongSegment}'}" để vươn tới những đỉnh cao mới.`,
      `Lời khuyên là hãy biến sự độc bản ở đoạn "${'{strongSegment}'}" thành phong cách hành văn thương hiệu của riêng mình.`,
      `Hãy dấn thân vào các đề tài nghiên cứu hóc búa hơn, lấy sự sắc bén tại đoạn "${'{strongSegment}'}" làm bệ phóng.`,
      `Duy trì bản lĩnh tư duy tuyệt vời như ở đoạn "${'{strongSegment}'}" chính là chìa khóa để em chinh phục mọi thử thách học thuật.`,
      `Hãy tự tin chia sẻ những góc nhìn độc bản và đầy sức nặng trí tuệ như tại phân đoạn "${'{strongSegment}'}".`,
      `Tiếp tục mài giũa tư duy sắc sảo từ nền tảng thành công ở đoạn "${'{strongSegment}'}" để hướng tới các bài viết mang tầm vóc lớn.`,
      `Hãy giữ vững sự kiêu hãnh trí tuệ và tinh thần tự chủ tuyệt đối đã kết tinh trọn vẹn qua đoạn "${'{strongSegment}'}".`,
      `Khung lời khuyên khép lại bằng sự khích lệ em hãy tiếp tục làm chủ hoàn toàn không gian sáng tạo của chính mình.`,
    ],
  },
  {
    weak: [
      `Báo động đỏ về sự lệ thuộc AI thể hiện qua đoạn "${'{dependentSegment}'}"; hãy buông bỏ gậy chống để tự đứng trên đôi chân mình.`,
      `Sự bấp bênh khi thiếu vắng công cụ hỗ trợ lộ rõ ở đoạn "${'{dependentSegment}'}"; hãy tập thói quen tự tư duy độc lập.`,
      `Thói quen trông chờ vào ngoại lực đang làm lu mờ năng lực thật, minh chứng qua sự yếu ớt tại đoạn "${'{dependentSegment}'}".`,
      `Hãy cai nghiện ngay sự lệ thuộc công nghệ biểu hiện qua đoạn "${'{dependentSegment}'}" bằng kỷ luật tự viết nghiêm ngặt.`,
      `Sự thiếu tự chủ ở đoạn "${'{dependentSegment}'}" là hệ quả của việc lười suy luận; em cần lập tức thay đổi phương pháp học.`,
      `Hãy tập phản xạ tư duy thực chiến trong phòng thi kín bằng cách tự lực hoàn thành các bài tập như đoạn "${'{dependentSegment}'}".`,
      `Đừng để công cụ ngoại biên cướp đi giọng nói nguyên bản của em như đã xảy ra ở đoạn "${'{dependentSegment}'}".`,
      `Phương pháp luyện tập cấp bách là ngắt kết nối hoàn toàn với các nguồn gợi ý khi viết lại đoạn "${'{dependentSegment}'}".`,
      `Sự bất an khi đối diện trang giấy trắng tại đoạn "${'{dependentSegment}'}" đòi hỏi em phải rèn luyện ý chí tự chủ kiên định.`,
      `Hãy chứng minh năng lực thật của mình bằng cách tự tay viết lại toàn bộ ý tưởng yếu kém ở đoạn "${'{dependentSegment}'}".`,
    ],
    medium: [
      `Ý thức tự chủ đang dần hình thành rất tốt qua cách học sinh tự lực hoàn thành đoạn "${'{independentSegment}'}"; hãy giữ vững.`,
      `Nỗ lực tự lập trong tư duy ghi nhận qua đoạn "${'{independentSegment}'}" cho thấy tín hiệu cực kỳ đáng mừng.`,
      `Hãy tiếp tục phát huy năng lực tự chủ thao tác đã làm rất tốt tại phân đoạn "${'{independentSegment}'}".`,
      `Sự tự tin khi không lệ thuộc công cụ phản ánh qua đoạn "${'{independentSegment}'}" là nền tảng vô cùng vững chắc.`,
      `Hãy duy trì thói quen tự lực khai thác vấn đề như cách em đã làm ở đoạn "${'{independentSegment}'}".`,
      `Bước tiến trong ý thức tự chủ tư duy minh chứng qua phân đoạn "${'{independentSegment}'}" rất đáng khích lệ.`,
      `Hãy biến sự độc lập thành phản xạ tự nhiên khi viết bài, bắt đầu từ việc duy trì phong độ như ở đoạn "${'{independentSegment}'}".`,
      `Sự nỗ lực tự thân qua đoạn "${'{independentSegment}'}" khẳng định em đang đi đúng hướng trên con đường tự chủ.`,
      `Hãy tiếp tục nuôi dưỡng tinh thần làm bài độc lập, không dựa dẫm như minh chứng tại đoạn "${'{independentSegment}'}".`,
      `Khung năng lực tự chủ củng cố vững chắc qua cách hoàn thành đáng khen ngợi ở đoạn "${'{independentSegment}'}".`,
    ],
    good: [
      `Em chính là câu trả lời đanh thép nhất cho thấy năng lực tự chủ hoàn toàn chiến thắng mọi nghi ngờ thời đại AI qua đoạn "${'{authenticSegment}'}".`,
      `Minh chứng hùng hồn cho trí tuệ nguyên bản tỏa sáng rực rỡ qua phân đoạn tự lực "${'{authenticSegment}'}".`,
      `Sự tự chủ đỉnh cao và bản lĩnh chống lại mọi sự lệ thuộc ngoại biên kết tinh trọn vẹn ở đoạn "${'{authenticSegment}'}".`,
      `Em đã bảo vệ thành công tiếng nói cá nhân độc bản, minh chứng sống động qua đoạn văn tự lực "${'{authenticSegment}'}".`,
      `Năng lực tự chủ tuyệt đối không cần gậy chống thể hiện qua đoạn "${'{authenticSegment}'}" là niềm tự hào lớn.`,
      `Sự chiến thắng hoàn toàn trước cám dỗ lệ thuộc công nghệ khẳng định qua câu chữ độc lập tại đoạn "${'{authenticSegment}'}".`,
      `Tư duy nguyên bản tự lực minh chứng qua đoạn "${'{authenticSegment}'}" chính là tài sản quý giá nhất của em.`,
      `Em đã làm chủ hoàn toàn vùng đất tư duy của chính mình, rực rỡ qua thành quả tự lập ở đoạn "${'{authenticSegment}'}".`,
      `Sự độc lập hoàn toàn không tì vết thể hiện qua đoạn "${'{authenticSegment}'}" là minh chứng cho trí tuệ chân chính.`,
      `Khung năng lực tự chủ khép lại bằng khúc khải hoàn vinh quang từ trí tuệ nguyên bản tại đoạn "${'{authenticSegment}'}".`,
    ],
  },
  {
    weak: [
      `Đừng nản lòng vì điểm số thấp hay sự cố ở đoạn "${'{lowResultSegment}'}"; thất bại hôm nay là cái giá cực kỳ rẻ để lột xác tư duy.`,
      `Khó khăn tại đoạn "${'{lowResultSegment}'}" chỉ là điểm khởi đầu; hãy đứng dậy, siết chặt kỷ luật và làm lại từ gốc rễ.`,
      `Hãy coi vấp ngã ở đoạn "${'{lowResultSegment}'}" là bài học xương máu để tái thiết lập toàn bộ chiến lược học tập.`,
      `Đừng sợ hãi điểm số chưa như ý ở đoạn "${'{lowResultSegment}'}", đó là cơ hội vàng để em nhận ra giới hạn và bứt phá.`,
      `Sự cố ở đoạn "${'{lowResultSegment}'}" không định nghĩa con người em, quyết tâm sửa đổi ngày mai mới là điều quyết định.`,
      `Hãy biến sự thất vọng tại đoạn "${'{lowResultSegment}'}" thành năng lượng chiến đấu mạnh mẽ hơn trong các bài tập tới.`,
      `Trở ngại ở đoạn "${'{lowResultSegment}'}" chỉ thử thách lòng kiên nhẫn; hãy bình tĩnh đối diện và chinh phục nó.`,
      `Sự hụt hẫng tại đoạn "${'{lowResultSegment}'}" sẽ là bệ phóng nếu em chịu khó lội ngược dòng từ hôm nay.`,
      `Đừng buông xuôi vì vấp ngã ở đoạn "${'{lowResultSegment}'}"; trí tuệ con người được tôi luyện qua những lần gian khó.`,
      `Hành trình vươn lên bắt đầu từ việc dũng cảm thừa nhận yếu kém tại đoạn "${'{lowResultSegment}'}" để tái sinh mạnh mẽ.`,
    ],
    medium: [
      `Hãy tiếp tục bám lấy nền tảng tích cực từ đoạn "${'{currentBase}'}"; em đang đi đúng hướng, chỉ cần thêm sự phóng khoáng.`,
      `Đà tiến bộ duy trì ổn định qua cơ sở tại đoạn "${'{currentBase}'}" là bước đệm tuyệt vời cho các mùa giải tiếp theo.`,
      `Hãy giữ vững sự tự tin từ thành quả ở đoạn "${'{currentBase}'}" và tự tin mở rộng biên độ tư duy của mình.`,
      `Nền tảng vững chắc từ đoạn "${'{currentBase}'}" cho thấy tiềm năng phát triển lớn nếu em giữ vững kỷ luật.`,
      `Hãy tiếp tục phát huy đà tăng trưởng tích cực này dựa trên những gì đã làm rất tốt ở đoạn "${'{currentBase}'}".`,
      `Thành quả ổn định tại đoạn "${'{currentBase}'}" chứng minh em hoàn toàn đủ sức vươn tới những nấc thang cao hơn.`,
      `Hãy lấy sự khích lệ từ đoạn "${'{currentBase}'}" làm động lực để liên tục mài giũa bản sắc cá nhân sắc sảo hơn.`,
      `Cơ sở hiện tại ở đoạn "${'{currentBase}'}" rất đáng khích lệ; hãy tiếp tục giữ lửa và chinh phục các đỉnh cao mới.`,
      `Sự tiến bộ đều đặn từ nền tảng đoạn "${'{currentBase}'}" phản ánh quá trình nỗ lực vô cùng nghiêm túc.`,
      `Khung tương lai rộng mở dựa trên bệ phóng vững chãi từ thành quả ghi nhận tại đoạn "${'{currentBase}'}".`,
    ],
    good: [
      `Hành trình bứt phá tại đoạn "${'{triumphSegment}'}" đã chạm đến ngưỡng cửa vinh quang; hãy ngẩng cao đầu tự hào.`,
      `Thành tựu rực rỡ minh chứng qua đoạn "${'{triumphSegment}'}" là phần thưởng xứng đáng cho trí tuệ nguyên bản.`,
      `Khúc khải hoàn trọn vẹn vang lên tại đoạn "${'{triumphSegment}'}", khẳng định vị thế của một tư duy xuất chúng.`,
      `Hãy tận hưởng trọn vẹn niềm vui chiến thắng từ đỉnh cao lập luận được thiết lập ở đoạn "${'{triumphSegment}'}".`,
      `Sự thăng hoa tuyệt mỹ tại đoạn "${'{triumphSegment}'}" mở ra cánh cửa chào đón em đến với những sân chơi lớn.`,
      `Thành quả đỉnh cao kết tinh ở đoạn "${'{triumphSegment}'}" là minh chứng sống động cho bản lĩnh học thuật.`,
      `Hãy giữ chặt hào quang chiến thắng từ đoạn "${'{triumphSegment}'}" và sẵn sàng chinh phục các đỉnh cao vũ trụ mới.`,
      `Sự vươn mình mạnh mẽ ghi nhận qua đoạn "${'{triumphSegment}'}" khẳng định vị thế dẫn đầu hoàn toàn xứng đáng.`,
      `Đỉnh vinh quang chạm tới tại đoạn "${'{triumphSegment}'}" khép lại hành trình bằng khúc ca khải hoàn kiêu hãnh.`,
      `Tương lai rực rỡ rộng mở phía trước, bắt đầu từ cột mốc vinh quang tuyệt vời tại đoạn "${'{triumphSegment}'}".`,
    ],
  },
];

export const FRAMES: TieredFrame[] = [FRAME1, FRAME2, FRAME3];

export function generateFrame(frame: TieredFrame, ctx: FeedbackContext, quotes: Quotes, tier: Tier, baseSeed: number): string {
  const tierPool = frame.map(slot => slot[tier]);
  const sentences: string[] = [];
  for (let i = 0; i < 5; i++) {
    const slotSeed = seededHash(baseSeed + i * 7919);
    const pool = tierPool[i];
    const raw = pool[slotSeed % pool.length];
    sentences.push(fill(raw, ctx, quotes));
  }
  return sentences.join(' ');
}

export function generateRoadmapFeedback(day: number, ctx: FeedbackContext): RoadmapFeedback {
  const quotes = extractQuotes(ctx.rawText);
  const seed = buildSeed(ctx);
  const dayOffset = day * 4099;
  const tier = selectTier(ctx.score);
  return {
    depth: generateFrame(FRAMES[0], ctx, quotes, tier, seed + dayOffset),
    vocab: generateFrame(FRAMES[1], ctx, quotes, tier, seed + dayOffset + 101),
    advice: generateFrame(FRAMES[2], ctx, quotes, tier, seed + dayOffset + 202),
  };
}

// --- Debate evaluation ---
type DebateVariant = {
  strengths: string;
  weaknesses: string;
  suggestion: string;
};

const DEBATE_EVAL_VARIANTS: DebateVariant[] = [
  {
    strengths: `Lập luận có độ dài đủ để phát triển ý. ${'{debateRounds}'} lượt phản biện cho thấy không né tranh luận — đã bước vào đấu trường với thái độ nghiêm túc.`,
    weaknesses: `Cần thêm lượt trao đổi để đào sâu luận điểm. ${'{debateRounds}'} lượt chưa đủ bẻ gãy luận điểm đối lập — cần thêm dẫn chứng cụ thể. Từ vựng phản biện còn hạn chế.`,
    suggestion: `Đặt câu hỏi "Tại sao?" cho chính luận điểm trước khi viết. Phát hiện lỗ hổng logic rồi công kích vào đó — đánh trúng điểm yếu một lần giá hơn mười lần đánh lan man.`,
  },
  {
    strengths: `${'{debateRounds}'} lượt tham gia — tín hiệu sẵn sàng đối đầu quan điểm trái chiều. Lập luận có nỗ lực, không né tránh. Thái độ phản biện đang hình thành tốt.`,
    weaknesses: `Số lượt còn ít — cần thêm thời gian để đào sâu và bẻ gãy luận điểm. Từ vựng phản biện còn mỏng — thiếu "luận điểm", "bằng chứng", "mâu thuẫn". Cần thêm dẫn chứng cụ thể.`,
    suggestion: `Trước khi phản bác, tóm tắt luận điểm đối phương trong 1 câu. Tìm 1 điểm yếu. Công kích vào đó trong 2-3 câu. Ngắn gọn, sắc bén, trúng đích.`,
  },
  {
    strengths: `Đã tham gia ${'{debateRounds}'} lượt giao tranh — không lùi bước. Lập luận có sức nặng ở mức khá. Tinh thần phản biện đang rèn tốt.`,
    weaknesses: `Cần thêm lượt để đào sâu — ${'{debateRounds}'} lượt chỉ chạm bề mặt. Một số lập luận còn chung chung — cần cụ thể hoá bằng ví dụ thực tế. Chú ý củng cố phòng thủ khi phản bác.`,
    suggestion: `Thử kỹ thuật "tự phản bác": viết phản bác rồi đóng vai đối phương để phản bác lại chính mình. Kỹ thuật này giúp củng cố lập luận trước khi đưa ra.`,
  },
  {
    strengths: `${'{debateRounds}'} lượt phản biện — tinh thần đấu trường đáng nể. Đã đối đầu AI không lùi bước, lập luận có nỗ lực công kích. Phản biện đang rèn qua thực chiến.`,
    weaknesses: `Lập luận còn dừng ở bề mặt — cần đào sâu hơn. ${'{debateRounds}'} lượt chưa đủ bẻ gãy luận điểm đối lập. Từ vựng phản biện còn an toàn, cần sắc bén hơn: "bác bỏ", "mâu thuẫn nội tại", "phản chứng".`,
    suggestion: `Trước khi phản bác, tìm điểm yếu nhất của đối phương. Công kích vào đó bằng 2-3 câu sắc bén. Đừng lan man — một đòn trúng điểm giá hơn mười đòn hụt.`,
  },
  {
    strengths: `Đã tham gia ${'{debateRounds}'} lượt — thái độ nghiêm túc với đấu trường. Lập luận có chiều hướng công kích, không chỉ phòng thủ. Tinh thần núi lửa đang bùng.`,
    weaknesses: `Cần thêm lượt để phát triển luận điểm đầy đủ. ${'{debateRounds}'} lượt chỉ chạm bề mặt. Cần thêm dẫn chứng cụ thể — lập luận chung chung thiếu sức thuyết phục. Từ vựng phản biện còn mỏng.`,
    suggestion: `Kỹ thuật "tự phản bác": viết phản bác, rồi đóng vai đối phương phản bác lại chính mình. Dự đoán phản đòn và chuẩn bị đáp trước — tạo lợi thế áp đảo trong tranh luận.`,
  },
];

export function generateDebateEval(ctx: FeedbackContext): DebateVariant {
  const seed = buildSeed(ctx);
  const idx = seed % DEBATE_EVAL_VARIANTS.length;
  const quotes = extractQuotes(ctx.rawText);
  const v = DEBATE_EVAL_VARIANTS[idx];
  return {
    strengths: fill(v.strengths, ctx, quotes),
    weaknesses: fill(v.weaknesses, ctx, quotes),
    suggestion: fill(v.suggestion, ctx, quotes),
  };
}

// --- Spam/toast messages ---
const SPAM_TOASTS: string[] = [
  'Bài viết quá ngắn — viết nghiêm túc đi, tư duy cần được rèn qua từng câu chữ!',
  'Nội dung chưa đủ — hãy viết thêm, không thể bỏ qua bước luyện tập này!',
  'Viết thêm đi — não cần vận hành, không thể đứng yên được!',
  'Chưa đủ từ — hãy nghiêm túc với bài viết, đây là cơ hội rèn tư duy!',
  'Dung nham chưa đủ — hãy viết thêm, núi lửa cần năng lượng để phun trào!',
  'Còn quá ngắn — phản biện cần chiều sâu, hãy đào sâu thêm!',
];

export function getRandomSpamToast(): string {
  return SPAM_TOASTS[Math.floor(Math.random() * SPAM_TOASTS.length)];
}

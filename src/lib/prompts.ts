export type Prompt = {
  id: number;
  title: string;
  description: string;
};

// Ngân hàng đề bài nghị luận tư duy phản biện
export const PROMPTS: Prompt[] = [
  {
    id: 1,
    title: 'AI có đang làm thui chột khả năng sáng tạo của học sinh?',
    description:
      'Khi học sinh sử dụng AI để hoàn thành bài tập, liệu họ còn tự sáng tạo hay chỉ sao chép ý tưởng máy móc? Hãy nghị luận về tác động của AI đến quá trình sáng tạo độc lập.',
  },
  {
    id: 2,
    title: 'Mạng xã hội giúp hay hại cho khả năng tư duy phức tạp?',
    description:
      'Mạng xã hội cung cấp lượng thông tin khổng lồ nhưng cũng tạo ra "bong bóng lọc" (filter bubble). Nó giúp học sinh tiếp cận đa chiều hay làm nông cạn tư duy phản biện?',
  },
  {
    id: 3,
    title: 'Học sinh có nên tự học qua AI thay vì đến trường?',
    description:
      'Với AI có thể trả lời mọi câu hỏi, vai trò của trường học và giáo viên có còn cần thiết? Hãy nghị luận về sự thay đổi trong mô hình giáo dục thời đại số.',
  },
  {
    id: 4,
    title: 'Công nghệ thông minh khiến con người lười suy nghĩ?',
    description:
      'Từ bản đồ chỉ đường đến gợi ý viết lách, công nghệ làm thay nhiều việc. Điều này có đang triệt tiêu thói quen tư duy sâu, hay chỉ chuyển đổi hình thức suy nghĩ?',
  },
  {
    id: 5,
    title: 'Nên cấm học sinh dùng AI trong bài tập hay nên hướng dẫn sử dụng?',
    description:
      'Cấm hoàn toàn có thể khiến học sinh thiếu kỹ năng thời đại số, nhưng cho phép tự do có thể dẫn đến lạm dụng. Phương án nào phù hợp với giáo dục THPT hiện nay?',
  },
  {
    id: 6,
    title: 'Chữ viết tay có còn giá trị trong thời đại gõ phím và AI?',
    description:
      'Khi mọi thứ đều số hoá, việc viết tay có còn giúp não bộ ghi nhớ và tư duy tốt hơn? Hãy nghị luận về giá trị nhận thức của chữ viết tay so với gõ máy tính.',
  },
];

export const DEFAULT_PROMPT = PROMPTS[0];

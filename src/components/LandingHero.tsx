import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import {
  Sparkles,
  Brain,
  BookOpen,
  ArrowRight,
  FlaskConical,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import type { Page } from '@/lib/pages';

export default function LandingHero({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const { user, profile } = useAuth();

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-16">
      {/* Badge */}
      <div className="mb-8 flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-brand-700 shadow-sm backdrop-blur-md dark:bg-slate-800/60 dark:text-brand-300 animate-fade-in-up">
        <Sparkles className="h-4 w-4" />
        Nghiên cứu Khoa học Kỹ thuật · Học sinh THPT
      </div>

      {/* Title */}
      <div className="mx-auto max-w-5xl text-center animate-fade-in-up">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 dark:text-brand-400">
          Đề tài
        </p>
        <h1 className="text-3xl font-extrabold leading-tight text-brand-700 text-glow sm:text-4xl md:text-5xl lg:text-6xl dark:text-brand-200">
          Semantic Drift trong thời đại AI
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
          Sự biến đổi khả năng biểu đạt tư duy phức tạp của học sinh THPT
        </p>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row animate-fade-in-up">
        {user ? (
          <Button
            onClick={() => onNavigate('workspace')}
            className="px-8 py-3 text-base"
          >
            <FlaskConical className="h-5 w-5" />
            Vào không gian làm bài
          </Button>
        ) : (
          <Button
            onClick={() => onNavigate('auth')}
            className="px-8 py-3 text-base"
          >
            Bắt đầu tham gia
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
        {user && profile && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Chào, <strong className="text-brand-600 dark:text-brand-300">{profile.full_name}</strong>
          </span>
        )}
      </div>

      {/* Feature cards */}
      <div className="mt-20 grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3 animate-fade-in-up">
        {[
          {
            icon: <Brain className="h-6 w-6" />,
            title: 'Phân tích ngữ nghĩa',
            desc: 'Khảo sát cách học sinh biểu đạt tư duy phức tạp khi tương tác với AI.',
          },
          {
            icon: <BookOpen className="h-6 w-6" />,
            title: 'Tài liệu nghiên cứu',
            desc: 'Truy cập bộ câu hỏi và phương pháp thu thập dữ liệu chuẩn hoá.',
          },
          {
            icon: <GraduationCap className="h-6 w-6" />,
            title: 'Dành cho THPT',
            desc: 'Thiết kế riêng cho học sinh trung học phổ thông trên cả nước.',
          },
        ].map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-slate-800/60"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-transform group-hover:scale-110 dark:bg-brand-900/40 dark:text-brand-300">
              {f.icon}
            </div>
            <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Socratic AI hint */}
      <div className="mt-16 flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 animate-fade-in">
        <MessageSquare className="h-4 w-4" />
        Trợ lý Socratic AI luôn sẵn sàng hỗ trợ trong không gian làm bài
      </div>
    </section>
  );
}

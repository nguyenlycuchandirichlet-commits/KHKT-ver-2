import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Field } from '@/components/ui';
import { X, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordModal({
  open,
  onClose,
  onBack,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?reset=1`,
      });
      if (error) throw error;
      setSent(true);
    } catch (cause) {
      const err = cause as { message?: string };
      setError(
        'Không thể gửi email đặt lại mật khẩu. Vui lòng kiểm tra lại địa chỉ email và thử lại.',
      );
      console.error('reset email failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-scale-in dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/40">
              <Mail className="h-7 w-7 text-brand-600 dark:text-brand-300" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-800 dark:text-slate-100">
              Đã gửi email đặt lại mật khẩu
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nếu địa chỉ email đã được đăng ký, bạn sẽ nhận được một email hướng
              dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (bao gồm cả mục
              thư rác).
            </p>
            <Button className="mt-6 w-full" onClick={onClose}>
              Đã hiểu
            </Button>
          </div>
        ) : (
          <>
            <h3 className="mb-2 text-xl font-bold text-slate-800 dark:text-slate-100">
              Quên mật khẩu?
            </h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Nhập địa chỉ email liên kết với tài khoản của bạn. Chúng tôi sẽ gửi
              liên kết đặt lại mật khẩu.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field
                label="Địa chỉ email"
                name="email"
                type="email"
                required
                placeholder="ban@email.com"
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
              />
              <Button type="submit" loading={loading} className="w-full">
                Gửi email đặt lại mật khẩu
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

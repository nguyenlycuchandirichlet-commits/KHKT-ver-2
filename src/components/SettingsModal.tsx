import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { PROVINCES } from '@/lib/provinces';
import {
  X,
  UserCog,
  Sun,
  Moon,
  UserPlus,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { Page } from '@/lib/pages';

type AddAccountForm = {
  full_name: string;
  username: string;
  password: string;
  class_name: string;
  school: string;
  province: string;
};

const emptyForm: AddAccountForm = {
  full_name: '',
  username: '',
  password: '',
  class_name: '',
  school: '',
  province: '',
};

export default function SettingsModal({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
}) {
  const { signOut, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  // Add account form state
  const [form, setForm] = useState<AddAccountForm>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  if (!open) return null;

  const setField = (k: keyof AddAccountForm, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleManageAccount = () => {
    onClose();
    onNavigate('profile');
  };

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      setAddError('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      setAddError('Tên tài khoản phải có ít nhất 3 ký tự.');
      return;
    }
    if (form.password.length < 6) {
      setAddError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_student_account', {
        p_full_name: form.full_name.trim(),
        p_username: form.username.trim(),
        p_password: form.password,
        p_class_name: form.class_name.trim(),
        p_school: form.school.trim(),
        p_province: form.province,
        p_date_of_birth: null,
      });
      if (error) throw error;
      const rows = data as {
        success: boolean;
        user_id: string | null;
        error_message: string | null;
      }[];
      const result = rows?.[0];
      if (!result?.success) {
        setAddError(result?.error_message || 'Không thể tạo tài khoản.');
        return;
      }
      setAddSuccess(
        `Đã tạo tài khoản "${form.username.trim()}" thành công! Học sinh có thể đăng nhập ngay với tên tài khoản và mật khẩu vừa tạo.`,
      );
      setForm(emptyForm);
    } catch (cause) {
      const err = cause as { message?: string };
      setAddError('Không thể tạo tài khoản. Vui lòng thử lại.');
      console.error('create student account failed', err);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    signOut().then(() => {
      onClose();
      onNavigate('landing');
    });
  };

  const MenuItem = ({
    icon,
    label,
    sublabel,
    onClick,
    danger,
  }: {
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
    onClick: () => void;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl p-3.5 text-left transition-all hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
        danger
          ? 'text-red-600 dark:text-red-400'
          : 'text-slate-700 dark:text-slate-200'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          danger
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-brand-100 dark:bg-brand-900/30'
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {sublabel && (
          <span className="block text-xs text-slate-400 dark:text-slate-500">
            {sublabel}
          </span>
        )}
      </span>
      <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600" />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scale-in dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Cài đặt
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thông tin người dùng hiện tại */}
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
            {(profile?.full_name || 'HK').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {profile?.full_name || 'Học sinh'}
            </p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">
              @{profile?.username || 'tai-khoan'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <MenuItem
            icon={
              <UserCog className="h-5 w-5 text-brand-600 dark:text-brand-300" />
            }
            label="Quản lý tài khoản"
            sublabel="Xem và cập nhật hồ sơ học sinh"
            onClick={handleManageAccount}
          />
          <MenuItem
            icon={
              theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-brand-600 dark:text-brand-300" />
              )
            }
            label={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            sublabel={`Đang dùng: ${theme === 'dark' ? 'tối' : 'sáng'}`}
            onClick={toggleTheme}
          />
          <MenuItem
            icon={
              <UserPlus className="h-5 w-5 text-brand-600 dark:text-brand-300" />
            }
            label="Thêm tài khoản"
            sublabel="Tạo tài khoản học sinh mới không cần đăng xuất"
            onClick={() => setAddAccountOpen(true)}
          />
          <MenuItem
            icon={<LogOut className="h-5 w-5" />}
            label="Đăng xuất tài khoản"
            sublabel="Thoát phiên làm việc hiện tại"
            onClick={handleLogout}
            danger
          />
        </div>
      </div>

      {/* Sub-modal: Thêm tài khoản */}
      {addAccountOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setAddAccountOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-scale-in dark:bg-slate-900 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/40">
                  <UserPlus className="h-5 w-5 text-brand-600 dark:text-brand-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Thêm tài khoản học sinh
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Tạo tài khoản mới mà không cần đăng xuất
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddAccountOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-300" />
                </div>
                <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
                  {addSuccess}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAddSuccess('');
                      setAddAccountOpen(false);
                    }}
                    className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Hoàn tất
                  </button>
                  <button
                    onClick={() => setAddSuccess('')}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Thêm tài khoản khác
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleAddAccountSubmit}
                className="flex flex-col gap-4"
              >
                {addError && (
                  <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {addError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={form.full_name}
                      onChange={(e) => setField('full_name', e.target.value)}
                      placeholder="Nguyễn Văn B"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Tên tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={form.username}
                      onChange={(e) => setField('username', e.target.value)}
                      placeholder="tài khoản mới"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="password"
                      value={form.password}
                      onChange={(e) => setField('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Lớp
                    </label>
                    <input
                      value={form.class_name}
                      onChange={(e) => setField('class_name', e.target.value)}
                      placeholder="12A1"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Trường THPT
                    </label>
                    <input
                      value={form.school}
                      onChange={(e) => setField('school', e.target.value)}
                      placeholder="THPT ..."
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Tỉnh/thành phố
                    </label>
                    <select
                      value={form.province}
                      onChange={(e) => setField('province', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                    >
                      <option value="">Chọn tỉnh/thành</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAddAccountOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-60"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Tạo tài khoản
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

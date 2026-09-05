import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useMultiAccount } from '@/context/MultiAccountContext';
import { useTheme } from '@/context/ThemeContext';
import { PROVINCES } from '@/lib/provinces';
import type { ManagedAccount } from '@/lib/multiAccount';
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
  Users,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { Page } from '@/lib/pages';

type AddAccountForm = {
  full_name: string;
  username: string;
  email: string;
  password: string;
  confirm: string;
  date_of_birth: string;
  class_name: string;
  school: string;
  province: string;
};

const emptyForm: AddAccountForm = {
  full_name: '',
  username: '',
  email: '',
  password: '',
  confirm: '',
  date_of_birth: '',
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
  const { accounts, activeAccountId, addAccount, switchAccount, switching, switchError, clearSwitchError } = useMultiAccount();
  const [view, setView] = useState<'main' | 'add' | 'switch'>('main');

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
    if (form.password !== form.confirm) {
      setAddError('Xác nhận mật khẩu không khớp.');
      return;
    }
    if (
      !form.full_name ||
      !form.date_of_birth ||
      !form.province ||
      !form.school ||
      !form.class_name ||
      !form.username ||
      !form.email
    ) {
      setAddError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    const emailTrim = form.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      setAddError('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
      return;
    }

    setCreating(true);
    try {
      const usernameTrim = form.username.trim();

      // Use an isolated Supabase client with separate session storage so
      // signUp() does not overwrite the active user's session token.
      const isolatedClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            flowType: 'implicit',
            storageKey: 'khkt-add-account-temp',
          },
        },
      );

      const { data, error } = await isolatedClient.auth.signUp({
        email: emailTrim,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            username: usernameTrim,
            date_of_birth: form.date_of_birth || null,
            province: form.province.trim(),
            school: form.school.trim(),
            class_name: form.class_name.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes('already') || error.message.includes('User already registered')) {
          setAddError('Email đã được đăng ký. Vui lòng dùng email khác.');
        } else {
          setAddError(error.message);
        }
        return;
      }

      const newUser = data.user;
      if (!newUser) {
        setAddError('Đăng ký không thành công — không nhận được thông tin người dùng.');
        return;
      }

      // Upsert profile using the isolated client — it holds the new user's
      // session, so auth.uid() matches the profile row's id and RLS allows
      // the insert. The main client's session (original user) is untouched.
      const { error: profileErr } = await isolatedClient
        .from('profiles')
        .upsert({
          id: newUser.id,
          full_name: form.full_name.trim(),
          date_of_birth: form.date_of_birth || null,
          province: form.province.trim(),
          school: form.school.trim(),
          class_name: form.class_name.trim(),
          username: usernameTrim,
          email: emailTrim,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileErr) {
        if (profileErr.code === '23505') {
          setAddError('Tên tài khoản đã tồn tại. Vui lòng chọn tên khác.');
        } else {
          setAddError(`Lỗi tạo hồ sơ: ${profileErr.message}`);
          console.error('profile insert failed', profileErr);
        }
        await isolatedClient.auth.signOut();
        return;
      }

      // Clean up the isolated session so it doesn't linger in storage
      await isolatedClient.auth.signOut();

      const newAccount: ManagedAccount = {
        user_id: newUser.id,
        email: emailTrim,
        username: usernameTrim,
        full_name: form.full_name.trim(),
        school: form.school.trim(),
        province: form.province.trim(),
        class_name: form.class_name.trim(),
        password: form.password,
        created_at: new Date().toISOString(),
      };
      addAccount(newAccount);

      setAddSuccess(
        `Đã tạo tài khoản "${usernameTrim}" thành công! Học sinh có thể đăng nhập ngay với email và mật khẩu vừa tạo.`,
      );
      setForm(emptyForm);
    } catch (cause) {
      const err = cause as { message?: string };
      setAddError(err.message || 'Không thể tạo tài khoản. Vui lòng thử lại.');
      console.error('create student account failed', err);
    } finally {
      setCreating(false);
    }
  };

  const handleSwitchAccount = async (account: ManagedAccount) => {
    await switchAccount(account);
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
            {view === 'add' ? 'Thêm tài khoản' : view === 'switch' ? 'Chuyển tài khoản' : 'Cài đặt'}
          </h2>
          <button
            onClick={() => {
              if (view !== 'main') {
                setView('main');
                setAddError('');
                setAddSuccess('');
                clearSwitchError();
              } else {
                onClose();
              }
            }}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current user info */}
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

        {view === 'main' && (
          <div className="flex flex-col gap-1">
            <MenuItem
              icon={<UserCog className="h-5 w-5 text-brand-600 dark:text-brand-300" />}
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
              icon={<Users className="h-5 w-5 text-brand-600 dark:text-brand-300" />}
              label="Chuyển tài khoản"
              sublabel={`${accounts.length} tài khoản trên thiết bị`}
              onClick={() => setView('switch')}
            />
            <MenuItem
              icon={<UserPlus className="h-5 w-5 text-brand-600 dark:text-brand-300" />}
              label="Thêm tài khoản"
              sublabel="Tạo tài khoản học sinh mới không cần đăng xuất"
              onClick={() => setView('add')}
            />
            <MenuItem
              icon={<LogOut className="h-5 w-5" />}
              label="Đăng xuất tài khoản"
              sublabel="Thoát phiên làm việc hiện tại"
              onClick={handleLogout}
              danger
            />
          </div>
        )}

        {view === 'switch' && (
          <div className="flex flex-col gap-2">
            {switchError && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {switchError}
              </div>
            )}
            {switching && (
              <div className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang chuyển tài khoản...
              </div>
            )}
            {accounts.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chưa có tài khoản nào được lưu trên thiết bị.
                </p>
                <button
                  onClick={() => setView('add')}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <UserPlus className="h-4 w-4" />
                  Thêm tài khoản đầu tiên
                </button>
              </div>
            ) : (
              accounts.map((account) => {
                const isActive = account.user_id === activeAccountId;
                return (
                  <button
                    key={account.user_id}
                    disabled={isActive || switching}
                    onClick={() => handleSwitchAccount(account)}
                    className={`flex items-center gap-3 rounded-xl p-3 text-left transition ${
                      isActive
                        ? 'border-2 border-brand-400 bg-brand-50/50 dark:bg-brand-900/20'
                        : 'bg-white hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800'
                    } disabled:cursor-default`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                      {account.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {account.full_name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        @{account.username}
                        {account.school && ` · ${account.school}`}
                      </p>
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        <Check className="h-3 w-3" />
                        Đang dùng
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {view === 'add' && (
          <>
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
                      setView('switch');
                    }}
                    className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Xem danh sách tài khoản
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
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      placeholder="email@example.com"
                      autoComplete="off"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Ngày tháng năm sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => setField('date_of_birth', e.target.value)}
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
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="password"
                      value={form.confirm}
                      onChange={(e) => setField('confirm', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full rounded-xl border bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-2 dark:bg-slate-800/70 dark:text-slate-100 ${
                        form.confirm && form.confirm !== form.password
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30'
                          : 'border-slate-200 focus:border-brand-400 focus:ring-brand-400/30 dark:border-slate-700'
                      }`}
                    />
                    {form.confirm && form.confirm !== form.password && (
                      <span className="text-xs text-red-500">Mật khẩu không khớp</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Trường THPT <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={form.school}
                      onChange={(e) => setField('school', e.target.value)}
                      placeholder="THPT ..."
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Lớp <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
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
                      Tỉnh/thành phố <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
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
                    onClick={() => setView('main')}
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
          </>
        )}
      </div>
    </div>
  );
}

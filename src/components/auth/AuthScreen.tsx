import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button, Field, SelectField } from '@/components/ui';
import { PROVINCES } from '@/lib/provinces';
import { addManagedAccount } from '@/lib/multiAccount';
import ForgotPasswordModal from './ForgotPasswordModal';
import {
  User as UserIcon,
  Lock,
  Calendar,
  School,
  Hash,
  UserCircle,
  Mail,
} from 'lucide-react';

type Mode = 'login' | 'register';

type RegForm = {
  full_name: string;
  date_of_birth: string;
  province: string;
  school: string;
  class_name: string;
  username: string;
  email: string;
  password: string;
  confirm: string;
};

type ProfileUpsertPayload = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  province: string;
  school: string;
  class_name: string;
  username: string;
  email: string;
  updated_at: string;
};

const emptyReg: RegForm = {
  full_name: '',
  date_of_birth: '',
  province: '',
  school: '',
  class_name: '',
  username: '',
  email: '',
  password: '',
  confirm: '',
};

export default function AuthScreen() {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<Mode>('register');
  const [forgotOpen, setForgotOpen] = useState(false);

  // login
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // register
  const [reg, setReg] = useState<RegForm>(emptyReg);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regDone, setRegDone] = useState(false);

  const setRegField = (k: keyof RegForm, v: string) =>
    setReg((p) => ({ ...p, [k]: v }));

  const handleGoogleLogin = async () => {
    setLoginError('');
    setRegError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (cause) {
      const err = cause as { message?: string };
      setLoginError(err.message || 'Đăng nhập Google thất bại.');
      setRegError(err.message || 'Đăng nhập Google thất bại.');
      console.error('google oauth failed', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const input = loginUser.trim();
      const looksLikeEmail = input.includes('@');
      let email = input;

      if (!looksLikeEmail) {
        // Tra cứu username → email qua RPC
        const { data, error: rpcErr } = await supabase.rpc('get_user_by_username', {
          p_username: input,
        });
        if (rpcErr) throw new Error(`Lỗi tra cứu: ${rpcErr.message}`);
        const rows = data as { id: string; email: string }[] | null;
        if (!rows || rows.length === 0) {
          setLoginError('Tên tài khoản không tồn tại. Vui lòng kiểm tra lại.');
          return;
        }
        email = rows[0].email;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: loginPass,
      });

      if (signInErr) {
        if (signInErr.message.includes('Invalid login credentials')) {
          setLoginError('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
        } else if (signInErr.message.includes('Email not confirmed')) {
          setLoginError('Email chưa được xác thực. Vui lòng kiểm tra hộp thư và nhấn vào đường dẫn xác nhận.');
        } else {
          setLoginError(signInErr.message);
        }
        return;
      }

      refreshProfile();
    } catch (cause) {
      const err = cause as { message?: string };
      setLoginError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      console.error('login failed', err);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (reg.password !== reg.confirm) {
      setRegError('Xác nhận mật khẩu không khớp.');
      return;
    }
    if (reg.password.length < 6) {
      setRegError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (
      !reg.full_name ||
      !reg.date_of_birth ||
      !reg.province ||
      !reg.school ||
      !reg.class_name ||
      !reg.username ||
      !reg.email
    ) {
      setRegError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    // Validate email format
    const emailTrim = reg.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      setRegError('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
      return;
    }

    setRegLoading(true);
    try {
      const usernameTrim = reg.username.trim();

      // Đăng ký với email thật — Supabase sẽ gửi email xác nhận
      // Include all metadata in options.data so ensure_profile fallback can use them
      const { data, error } = await supabase.auth.signUp({
        email: emailTrim,
        password: reg.password,
        options: {
          data: {
            full_name: reg.full_name.trim(),
            username: usernameTrim,
            date_of_birth: reg.date_of_birth || null,
            province: reg.province.trim(),
            school: reg.school.trim(),
            class_name: reg.class_name.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes('already') || error.message.includes('User already registered')) {
          setRegError('Email đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.');
        } else {
          setRegError(error.message);
        }
        return;
      }

      const user = data.user;
      if (!user) {
        setRegError('Đăng ký không thành công — không nhận được thông tin người dùng.');
        return;
      }

      // Build explicit typed payload with all metadata fields to prevent null persistence.
      // Every field from the form is explicitly mapped to its matching DB column —
      // none are left unassigned or allowed to fall through as null/undefined.
      const profilePayload: ProfileUpsertPayload = {
        id: user.id,
        full_name: reg.full_name.trim(),
        date_of_birth: reg.date_of_birth || null,
        province: reg.province.trim(),
        school: reg.school.trim(),
        class_name: reg.class_name.trim(),
        username: usernameTrim,
        email: emailTrim,
        updated_at: new Date().toISOString(),
      };

      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileErr) {
        if (profileErr.code === '23505') {
          setRegError('Tên tài khoản đã tồn tại. Vui lòng chọn tên khác.');
          await supabase.auth.signOut();
          return;
        }
        setRegError(`Lỗi tạo hồ sơ: ${profileErr.message}`);
        console.error('profile insert failed', profileErr);
        return;
      }

      addManagedAccount({
        user_id: user.id,
        email: emailTrim,
        username: usernameTrim,
        full_name: reg.full_name.trim(),
        school: reg.school.trim(),
        province: reg.province.trim(),
        class_name: reg.class_name.trim(),
        password: reg.password,
        created_at: new Date().toISOString(),
      });

      setRegDone(true);
    } catch (cause) {
      const err = cause as { message?: string; code?: string };
      setRegError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
      console.error('register failed', err);
    } finally {
      setRegLoading(false);
    }
  };

  if (regDone) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl animate-scale-in dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
            <UserCircle className="h-7 w-7 text-green-600 dark:text-green-300" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-800 dark:text-slate-100">
            Đăng ký thành công!
          </h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Chúng tôi đã gửi email xác nhận đến địa chỉ email của bạn. Vui lòng
            kiểm tra hộp thư (kể cả mục spam) và nhấn vào đường dẫn xác nhận để
            kích hoạt tài khoản. Sau khi xác nhận, bạn có thể đăng nhập.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              setRegDone(false);
              setMode('login');
              setReg(emptyReg);
            }}
          >
            Chuyển sang đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl lg:grid-cols-2 animate-fade-in-up">
        {/* Bên trái — giới thiệu đề tài */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-800 via-brand-900 to-slate-950 p-10 text-white lg:flex">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Hash className="h-5 w-5 text-brand-200" />
            </div>
            <span className="text-sm font-semibold tracking-wide">
              KHKT Research
            </span>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-bold leading-tight text-glow">
              Semantic Drift trong thời đại AI
            </h2>
            <p className="text-sm leading-relaxed text-brand-100/80">
              Nền tảng nghiên cứu khảo sát sự biến đổi khả năng biểu đạt tư duy
              phức tạp của học sinh THPT trong bối cảnh trí tuệ nhân tạo ngày
              càng phát triển.
            </p>
          </div>
          <div className="text-xs text-brand-200/60">
            Nghiên cứu Khoa học Kỹ thuật · 2026
          </div>
        </div>

        {/* Bên phải — form */}
        <div className="bg-white p-6 dark:bg-slate-900 sm:p-10">
          {/* Tabs */}
          <div className="mb-8 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setMode('register')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Đăng ký
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Đăng nhập
            </button>
          </div>

          {/* Google OAuth — hiện cho cả 2 tab */}
          <div className="mb-6">
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <GoogleIcon />
              Tiếp tục với Google
            </button>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">hoặc</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Đăng nhập
              </h1>
              {loginError && (
                <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {loginError}
                </div>
              )}
              <Field
                label="Tên tài khoản hoặc email"
                name="loginUser"
                required
                placeholder="Tên tài khoản hoặc email"
                icon={<UserIcon className="h-4 w-4" />}
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                autoComplete="username"
              />
              <Field
                label="Mật khẩu"
                name="loginPass"
                type="password"
                required
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                autoComplete="current-password"
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <Button type="submit" loading={loginLoading} className="w-full">
                Đăng nhập
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Tạo tài khoản mới
              </h1>
              {regError && (
                <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {regError}
                </div>
              )}
              <Field
                label="Họ và tên"
                name="full_name"
                required
                placeholder="Nguyễn Văn A"
                icon={<UserIcon className="h-4 w-4" />}
                value={reg.full_name}
                onChange={(e) => setRegField('full_name', e.target.value)}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                required
                placeholder="email@example.com"
                icon={<Mail className="h-4 w-4" />}
                value={reg.email}
                onChange={(e) => setRegField('email', e.target.value)}
                autoComplete="email"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Ngày tháng năm sinh"
                  name="date_of_birth"
                  type="date"
                  required
                  icon={<Calendar className="h-4 w-4" />}
                  value={reg.date_of_birth}
                  onChange={(e) => setRegField('date_of_birth', e.target.value)}
                />
                <SelectField
                  label="Tỉnh/thành phố"
                  name="province"
                  required
                  value={reg.province}
                  onChange={(e) => setRegField('province', e.target.value)}
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Trường THPT"
                  name="school"
                  required
                  placeholder="THPT ..."
                  icon={<School className="h-4 w-4" />}
                  value={reg.school}
                  onChange={(e) => setRegField('school', e.target.value)}
                />
                <Field
                  label="Lớp"
                  name="class_name"
                  required
                  placeholder="12A1"
                  icon={<Hash className="h-4 w-4" />}
                  value={reg.class_name}
                  onChange={(e) => setRegField('class_name', e.target.value)}
                />
              </div>
              <Field
                label="Tên tài khoản"
                name="username"
                required
                placeholder="tên đăng nhập"
                icon={<UserCircle className="h-4 w-4" />}
                value={reg.username}
                onChange={(e) => setRegField('username', e.target.value)}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Mật khẩu"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  value={reg.password}
                  onChange={(e) => setRegField('password', e.target.value)}
                />
                <Field
                  label="Xác nhận mật khẩu"
                  name="confirm"
                  type="password"
                  required
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  value={reg.confirm}
                  onChange={(e) => setRegField('confirm', e.target.value)}
                />
              </div>
              <Button type="submit" loading={regLoading} className="w-full">
                Hoàn tất đăng ký
              </Button>
              <p className="text-center text-xs text-slate-400">
                Sau khi đăng ký, bạn sẽ nhận được email xác nhận để kích hoạt tài khoản.
              </p>
            </form>
          )}
        </div>
      </div>

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        onBack={() => setForgotOpen(false)}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

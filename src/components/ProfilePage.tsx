import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button, Field, SelectField } from '@/components/ui';
import { PROVINCES } from '@/lib/provinces';
import {
  User as UserIcon,
  Calendar,
  School,
  Hash,
  MapPin,
  Save,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import type { Page } from '@/lib/pages';

export default function ProfilePage({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const { profile, refreshProfile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    date_of_birth: profile?.date_of_birth || '',
    province: profile?.province || '',
    school: profile?.school || '',
    class_name: profile?.class_name || '',
  });

  const setField = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          date_of_birth: form.date_of_birth || null,
          province: form.province,
          school: form.school.trim(),
          class_name: form.class_name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);
      if (error) throw error;
      await refreshProfile();
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (cause) {
      const err = cause as { message?: string };
      setError('Không thể cập nhật hồ sơ. Vui lòng thử lại.');
      console.error('profile update failed', err);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Không tìm thấy hồ sơ. Vui lòng đăng nhập lại.
          </p>
          <Button className="mt-4" onClick={() => onNavigate('auth')}>
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => onNavigate('workspace')}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>

        <div className="overflow-hidden rounded-3xl bg-white/80 shadow-xl backdrop-blur-md dark:bg-slate-800/60 animate-fade-in-up">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-brand-700 to-brand-900 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur-sm">
                {profile.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                <p className="text-sm text-brand-100/80">
                  @{profile.username}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Hồ sơ học sinh
              </h2>
              {!editing ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setForm({
                      full_name: profile.full_name,
                      date_of_birth: profile.date_of_birth || '',
                      province: profile.province,
                      school: profile.school,
                      class_name: profile.class_name,
                    });
                    setEditing(true);
                  }}
                >
                  Chỉnh sửa
                </Button>
              ) : null}
            </div>

            {saved && (
              <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                Đã lưu thay đổi hồ sơ thành công.
              </div>
            )}
            {error && (
              <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {!editing ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <InfoRow
                  icon={<UserIcon className="h-4 w-4" />}
                  label="Họ và tên"
                  value={profile.full_name}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Ngày sinh"
                  value={
                    profile.date_of_birth
                      ? new Date(profile.date_of_birth).toLocaleDateString(
                          'vi-VN',
                        )
                      : '—'
                  }
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Tỉnh/thành phố"
                  value={profile.province || '—'}
                />
                <InfoRow
                  icon={<School className="h-4 w-4" />}
                  label="Trường THPT"
                  value={profile.school || '—'}
                />
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Lớp"
                  value={profile.class_name || '—'}
                />
                <InfoRow
                  icon={<UserIcon className="h-4 w-4" />}
                  label="Tên tài khoản"
                  value={profile.username}
                  readonly
                />
              </div>
            ) : (
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <Field
                  label="Họ và tên"
                  name="full_name"
                  required
                  icon={<UserIcon className="h-4 w-4" />}
                  value={form.full_name}
                  onChange={(e) => setField('full_name', e.target.value)}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Ngày tháng năm sinh"
                    name="date_of_birth"
                    type="date"
                    icon={<Calendar className="h-4 w-4" />}
                    value={form.date_of_birth}
                    onChange={(e) => setField('date_of_birth', e.target.value)}
                  />
                  <SelectField
                    label="Tỉnh/thành phố"
                    name="province"
                    value={form.province}
                    onChange={(e) => setField('province', e.target.value)}
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
                    icon={<School className="h-4 w-4" />}
                    value={form.school}
                    onChange={(e) => setField('school', e.target.value)}
                  />
                  <Field
                    label="Lớp"
                    name="class_name"
                    icon={<Hash className="h-4 w-4" />}
                    value={form.class_name}
                    onChange={(e) => setField('class_name', e.target.value)}
                  />
                </div>
                <p className="rounded-lg bg-slate-50 px-4 py-2.5 text-xs text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                  Tên tài khoản không thể thay đổi. Liên hệ quản trị viên nếu
                  cần hỗ trợ.
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditing(false)}
                    className="flex-1"
                  >
                    Huỷ
                  </Button>
                  <Button
                    type="submit"
                    loading={saving}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4" />
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  readonly,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p
          className={`text-sm font-semibold ${readonly ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

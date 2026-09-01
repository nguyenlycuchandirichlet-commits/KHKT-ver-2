import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import SettingsModal from '@/components/SettingsModal';
import {
  Settings as SettingsIcon,
  History,
  LogIn,
  UserPlus,
  Hash,
  Sun,
  Moon,
  Home,
  ArrowLeft,
  Mountain,
  Trophy,
} from 'lucide-react';
import type { Page } from '@/lib/pages';

export default function TopNav({
  onNavigate,
  current,
  isInternal,
  onBack,
  onHome,
  canGoBack,
}: {
  onNavigate: (page: Page) => void;
  current: Page;
  isInternal: boolean;
  onBack: () => void;
  onHome: () => void;
  canGoBack: boolean;
}) {
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navPill =
    'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold shadow-sm backdrop-blur-md transition bg-white/70 text-slate-700 hover:bg-white hover:shadow-md dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Top-left: logo + nav buttons + auth buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onHome}
              className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-md dark:bg-slate-900/60"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
                <Hash className="h-4 w-4 text-white" />
              </div>
              <span className="hidden text-sm font-bold text-slate-700 dark:text-slate-200 sm:inline">
                KHKT
              </span>
            </button>

            {/* Nút Quay lại + Trang chủ — chỉ hiện trên trang nội bộ */}
            {isInternal && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onBack}
                  disabled={!canGoBack}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold shadow-sm backdrop-blur-md transition ${
                    canGoBack
                      ? 'bg-white/70 text-slate-700 hover:bg-white hover:shadow-md dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
                      : 'cursor-not-allowed bg-white/40 text-slate-400 opacity-50 dark:bg-slate-800/30 dark:text-slate-600'
                  }`}
                  title="Quay lại trang trước"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden md:inline">Quay lại</span>
                </button>
                <button
                  onClick={onHome}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition hover:from-brand-600 hover:to-brand-700 hover:shadow-lg"
                  title="Về trang chủ"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden md:inline">Trang chủ</span>
                </button>
              </div>
            )}

            {/* Nút Đăng nhập / Đăng ký — chỉ hiện khi chưa đăng nhập và ở landing */}
            {!user && !isInternal && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('auth')}
                  className={navPill}
                >
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </button>
                <button
                  onClick={() => onNavigate('auth')}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition hover:from-brand-600 hover:to-brand-700 hover:shadow-lg"
                >
                  <UserPlus className="h-4 w-4" />
                  Đăng ký
                </button>
              </div>
            )}
          </div>

          {/* Top-right: settings + history + theme */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-slate-600 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
              title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              aria-label="Chuyển chế độ sáng/tối"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={() => onNavigate(user ? 'roadmap' : 'auth')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-md transition ${
                current === 'roadmap'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white/70 text-slate-700 hover:bg-white dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Mountain className="h-4 w-4" />
              <span className="hidden sm:inline">Lộ trình</span>
            </button>

            <button
              onClick={() => onNavigate(user ? 'arena' : 'auth')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-md transition ${
                current === 'arena'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white/70 text-slate-700 hover:bg-white dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Sân đấu</span>
            </button>

            <button
              onClick={() => onNavigate(user ? 'history' : 'auth')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-md transition ${
                current === 'history'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white/70 text-slate-700 hover:bg-white dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Lịch sử làm bài</span>
            </button>

            <button
              onClick={() => (user ? setSettingsOpen(true) : onNavigate('auth'))}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-md transition ${
                settingsOpen
                  ? 'bg-brand-600 text-white'
                  : 'bg-white/70 text-slate-700 hover:bg-white dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Cài đặt</span>
            </button>

            {user && profile && (
              <div className="ml-1 hidden items-center gap-2 rounded-full bg-white/70 py-1.5 pl-1.5 pr-3 shadow-sm backdrop-blur-md dark:bg-slate-800/60 sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                  {profile.full_name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {profile.username}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
}

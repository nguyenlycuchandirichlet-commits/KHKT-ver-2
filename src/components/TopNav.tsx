import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMultiAccount } from '@/context/MultiAccountContext';
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
  ChevronDown,
  Check,
  Loader2,
  Menu,
  X,
  Shield,
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
  const { user, profile, isAdmin } = useAuth();
  const { accounts, activeAccountId, switchAccount, switching } = useMultiAccount();
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen && !mobileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (accountMenuOpen && accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [accountMenuOpen, mobileMenuOpen]);

  const navButtonClass = (isActive: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-md transition ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'bg-white/70 text-slate-700 hover:bg-white dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
    }`;

  const mobileMenuItemClass = (isActive: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
    }`;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
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
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur-md transition ${
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
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition hover:from-brand-600 hover:to-brand-700 hover:shadow-lg"
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
                  className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur-md transition hover:bg-white hover:shadow-md dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3.5 sm:py-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="sm:hidden">Đăng nhập</span>
                </button>
                <button
                  onClick={() => onNavigate('auth')}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition hover:from-brand-600 hover:to-brand-700 hover:shadow-lg sm:px-4"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Đăng ký</span>
                </button>
              </div>
            )}
          </div>

          {/* Top-right: theme toggle + mobile hamburger + desktop nav buttons + account */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-slate-600 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 sm:h-10 sm:w-10"
              title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              aria-label="Chuyển chế độ sáng/tối"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Desktop nav buttons (hidden on mobile) */}
            <div className="hidden items-center gap-2 sm:flex">
              {isAdmin ? (
                <button
                  onClick={() => onNavigate('admin')}
                  className={navButtonClass(current === 'admin')}
                >
                  <Shield className="h-4 w-4" />
                  <span>Quản trị</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate(user ? 'roadmap' : 'auth')}
                    className={navButtonClass(current === 'roadmap')}
                  >
                    <Mountain className="h-4 w-4" />
                    <span>Lộ trình</span>
                  </button>

                  <button
                    onClick={() => onNavigate(user ? 'arena' : 'auth')}
                    className={navButtonClass(current === 'arena')}
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Sân đấu</span>
                  </button>

                  <button
                    onClick={() => onNavigate(user ? 'history' : 'auth')}
                    className={navButtonClass(current === 'history')}
                  >
                    <History className="h-4 w-4" />
                    <span>Lịch sử</span>
                  </button>
                </>
              )}
              <button
                onClick={() => (user ? setSettingsOpen(true) : onNavigate('auth'))}
                className={navButtonClass(settingsOpen)}
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Cài đặt</span>
              </button>
            </div>

            {/* Mobile hamburger menu */}
            <div className="relative sm:hidden" ref={mobileMenuRef}>
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-slate-600 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Mở menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60 animate-scale-in dark:bg-slate-900 dark:ring-slate-700/60">
                  <div className="p-2">
                    {isAdmin ? (
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onNavigate('admin');
                        }}
                        className={mobileMenuItemClass(current === 'admin')}
                      >
                        <Shield className="h-4 w-4" />
                        Bảng quản trị
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigate(user ? 'roadmap' : 'auth');
                          }}
                          className={mobileMenuItemClass(current === 'roadmap')}
                        >
                          <Mountain className="h-4 w-4" />
                          Lộ trình
                        </button>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigate(user ? 'arena' : 'auth');
                          }}
                          className={mobileMenuItemClass(current === 'arena')}
                        >
                          <Trophy className="h-4 w-4" />
                          Sân đấu
                        </button>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigate(user ? 'history' : 'auth');
                          }}
                          className={mobileMenuItemClass(current === 'history')}
                        >
                          <History className="h-4 w-4" />
                          Lịch sử làm bài
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        user ? setSettingsOpen(true) : onNavigate('auth');
                      }}
                      className={mobileMenuItemClass(settingsOpen)}
                    >
                      <SettingsIcon className="h-4 w-4" />
                      Cài đặt
                    </button>
                  </div>
                </div>
              )}
            </div>

            {user && profile && (
              <div className="relative ml-0.5" ref={accountMenuRef}>
                <button
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full bg-white/70 py-1.5 pl-1.5 pr-1.5 shadow-sm backdrop-blur-md transition hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 sm:pr-3"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                    {profile.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden text-xs font-medium text-slate-600 dark:text-slate-300 sm:inline">
                    {profile.username}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60 animate-scale-in dark:bg-slate-900 dark:ring-slate-700/60">
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Tài khoản trên thiết bị
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {accounts.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <p className="text-xs text-slate-400">
                            Chưa có tài khoản nào được lưu.
                          </p>
                        </div>
                      ) : (
                        accounts.map((account) => {
                          const isActive = account.user_id === activeAccountId;
                          return (
                            <button
                              key={account.user_id}
                              disabled={isActive || switching}
                              onClick={() => {
                                switchAccount(account);
                                setAccountMenuOpen(false);
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                                isActive
                                  ? 'bg-brand-50/50 dark:bg-brand-900/20'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              } disabled:cursor-default`}
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-white">
                                {account.full_name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                                  {account.full_name}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                  @{account.username}
                                </p>
                              </div>
                              {isActive ? (
                                <Check className="h-4 w-4 shrink-0 text-brand-500" />
                              ) : switching ? (
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-300" />
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          setSettingsOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
                      >
                        <SettingsIcon className="h-4 w-4" />
                        Quản lý tài khoản
                      </button>
                    </div>
                  </div>
                )}
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

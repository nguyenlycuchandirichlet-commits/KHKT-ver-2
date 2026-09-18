import { useEffect, useState, useCallback } from 'react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MultiAccountProvider } from '@/context/MultiAccountContext';
import InteractiveBackground from '@/components/InteractiveBackground';
import TopNav from '@/components/TopNav';
import LandingHero from '@/components/LandingHero';
import AuthScreen from '@/components/auth/AuthScreen';
import WorkspacePage from '@/components/WorkspacePage';
import ProfilePage from '@/components/ProfilePage';
import HistoryPage from '@/components/HistoryPage';
import RoadmapPage from '@/components/RoadmapPage';
import ArenaPage from '@/components/ArenaPage';
import AdminDashboard from '@/components/AdminDashboard';
import type { Page } from '@/lib/pages';

// Trang nội bộ (hiển thị nút Trang chủ / Quay lại)
const INTERNAL_PAGES: Page[] = ['workspace', 'profile', 'history', 'roadmap', 'arena', 'admin'];

function AppShell() {
  const { theme } = useTheme();
  const { user, loading, isAdmin } = useAuth();
  const [page, setPage] = useState<Page>('landing');
  const [history, setHistory] = useState<Page[]>([]);

  useEffect(() => {
    if (loading) return;
    if (user && (page === 'landing' || page === 'auth')) {
      setHistory([]);
      setPage(isAdmin ? 'admin' : 'workspace');
    }
    if (
      !user &&
      (page === 'workspace' || page === 'profile' || page === 'history' || page === 'roadmap' || page === 'arena' || page === 'admin')
    ) {
      setHistory([]);
      setPage('landing');
    }
    if (!isAdmin && page === 'admin') {
      setHistory([]);
      setPage('workspace');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, isAdmin]);

  const navigate = useCallback(
    (p: Page) => {
      if ((p === 'workspace' || p === 'profile' || p === 'history' || p === 'roadmap' || p === 'arena') && !user) {
        setPage('auth');
        return;
      }
      if (p === 'admin' && !isAdmin) {
        return;
      }
      if (p === 'auth' && user) {
        setPage(isAdmin ? 'admin' : 'workspace');
        return;
      }
      setHistory((prev) => [...prev, page]);
      setPage(p);
    },
    [user, page],
  );

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) {
        setPage('workspace');
        return prev;
      }
      const next = [...prev];
      const last = next.pop()!;
      setPage(last);
      return next;
    });
  }, []);

  const goHome = useCallback(() => {
    setHistory([]);
    setPage(user ? (isAdmin ? 'admin' : 'workspace') : 'landing');
  }, [user, isAdmin]);

  const isInternal = INTERNAL_PAGES.includes(page);

  if (loading) {
    return (
      <>
        <InteractiveBackground isDark={theme === 'dark'} />
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
            Đang tải...
          </div>
        </div>
      </>
    );
  }

  // Trang auth: không hiển thị top nav (giao diện đăng nhập riêng)
  if (page === 'auth' && !user) {
    return (
      <>
        <InteractiveBackground isDark={theme === 'dark'} />
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <InteractiveBackground isDark={theme === 'dark'} />
      <TopNav
        onNavigate={navigate}
        current={page}
        isInternal={isInternal}
        onBack={goBack}
        onHome={goHome}
        canGoBack={history.length > 0}
      />
      <main>
        {page === 'landing' && <LandingHero onNavigate={navigate} />}
        {page === 'workspace' && user && !isAdmin && <WorkspacePage onNavigate={navigate} />}
        {page === 'profile' && user && !isAdmin && <ProfilePage onNavigate={navigate} />}
        {page === 'history' && user && !isAdmin && <HistoryPage onNavigate={navigate} />}
        {page === 'roadmap' && user && !isAdmin && <RoadmapPage onNavigate={navigate} />}
        {page === 'arena' && user && !isAdmin && <ArenaPage onNavigate={navigate} />}
        {page === 'admin' && user && isAdmin && <AdminDashboard onNavigate={navigate} />}
      </main>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MultiAccountProvider>
          <AppShell />
        </MultiAccountProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

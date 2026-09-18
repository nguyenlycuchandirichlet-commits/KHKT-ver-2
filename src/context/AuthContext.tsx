import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const ADMIN_SESSION_KEY = 'khkt-admin-session';

type LocalAdminSession = {
  role: 'admin';
  username: string;
  full_name: string;
  email: string;
  loginAt: number;
};

const ADMIN_PROFILE: Profile = {
  id: 'admin-local',
  full_name: 'Administrator',
  date_of_birth: null,
  province: 'System',
  school: 'Administration',
  class_name: 'Admin',
  username: 'Admin',
  email: 'admin@khkt.local',
  created_at: '',
  updated_at: '',
  role: 'admin',
};

const ADMIN_USER = {
  id: 'admin-local',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'admin@khkt.local',
  app_metadata: { provider: 'admin' },
  user_metadata: { full_name: 'Administrator', username: 'Admin' },
  created_at: '',
} as unknown as User;

function getLocalAdmin(): LocalAdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalAdminSession;
    if (parsed.role !== 'admin') return null;
    return parsed;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [localAdmin, setLocalAdmin] = useState<LocalAdminSession | null>(null);

  const loadProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      return;
    }

    // Profile chưa tồn tại hoặc RLS chặn — fallback tạo qua ensure_profile
    if (error) {
      console.error('profile query error:', error.message);
    }

    const { data: ensured, error: ensureErr } = await supabase.rpc('ensure_profile', {
      p_uid: uid,
    });

    if (ensureErr) {
      console.error('ensure_profile failed:', ensureErr.message);
      return;
    }

    if (ensured && Array.isArray(ensured) && ensured.length > 0) {
      setProfile(ensured[0] as Profile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (localAdmin) return;
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile, localAdmin]);

  useEffect(() => {
    let mounted = true;
    let profileLoading = false;

    // Check for local admin session first
    const admin = getLocalAdmin();
    if (admin) {
      setLocalAdmin(admin);
      setProfile(ADMIN_PROFILE);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        profileLoading = true;
        loadProfile(data.session.user.id).finally(() => {
          profileLoading = false;
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess?.user) {
        if (!profileLoading) {
          profileLoading = true;
          (async () => {
            await loadProfile(sess.user.id);
            profileLoading = false;
            if (mounted) setLoading(false);
          })();
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen for local admin login event
    const onAdminLogin = () => {
      if (!mounted) return;
      const admin = getLocalAdmin();
      if (admin) {
        setLocalAdmin(admin);
        setProfile(ADMIN_PROFILE);
        setLoading(false);
      }
    };
    window.addEventListener('khkt-admin-login', onAdminLogin);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener('khkt-admin-login', onAdminLogin);
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (localAdmin) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      setLocalAdmin(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, [localAdmin]);

  return (
    <AuthContext.Provider
      value={{
        user: localAdmin ? ADMIN_USER : (session?.user ?? null),
        session,
        profile,
        loading,
        isAdmin: !!localAdmin || profile?.role === 'admin',
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong AuthProvider');
  return ctx;
}

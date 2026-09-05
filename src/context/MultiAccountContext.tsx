import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getManagedAccounts,
  getActiveAccountId,
  setActiveAccountId,
  addManagedAccount,
  removeManagedAccount,
  updateManagedAccount,
  switchToAccount,
  syncProfileToManaged,
  type ManagedAccount,
} from '@/lib/multiAccount';

type MultiAccountContextValue = {
  accounts: ManagedAccount[];
  activeAccountId: string | null;
  switching: boolean;
  switchError: string;
  addAccount: (account: ManagedAccount) => void;
  removeAccount: (userId: string) => void;
  switchAccount: (account: ManagedAccount) => Promise<void>;
  clearSwitchError: () => void;
};

const MultiAccountContext = createContext<MultiAccountContextValue | undefined>(
  undefined,
);

export function MultiAccountProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile, signOut } = useAuth();
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [activeAccountId, setActiveId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');

  useEffect(() => {
    setAccounts(getManagedAccounts());
    setActiveId(getActiveAccountId());
  }, []);

  useEffect(() => {
    if (profile) {
      setActiveId(profile.id);
      setActiveAccountId(profile.id);
      syncProfileToManaged(profile);
    } else {
      const stored = getActiveAccountId();
      setActiveId(stored);
    }
  }, [profile]);

  const addAccount = useCallback((account: ManagedAccount) => {
    addManagedAccount(account);
    setAccounts(getManagedAccounts());
  }, []);

  const removeAccount = useCallback(
    (userId: string) => {
      removeManagedAccount(userId);
      setAccounts(getManagedAccounts());
    },
    [],
  );

  const switchAccount = useCallback(
    async (account: ManagedAccount) => {
      setSwitching(true);
      setSwitchError('');
      try {
        const result = await switchToAccount(account);
        if (!result.success) {
          setSwitchError(result.error || 'Không thể chuyển tài khoản.');
          return;
        }
        await refreshProfile();
        setAccounts(getManagedAccounts());
      } catch (cause) {
        const err = cause as { message?: string };
        setSwitchError(err.message || 'Không thể chuyển tài khoản.');
      } finally {
        setSwitching(false);
      }
    },
    [refreshProfile],
  );

  const clearSwitchError = useCallback(() => setSwitchError(''), []);

  const value: MultiAccountContextValue = {
    accounts,
    activeAccountId,
    switching,
    switchError,
    addAccount,
    removeAccount,
    switchAccount,
    clearSwitchError,
  };

  return (
    <MultiAccountContext.Provider value={value}>
      {children}
    </MultiAccountContext.Provider>
  );
}

export function useMultiAccount() {
  const ctx = useContext(MultiAccountContext);
  if (!ctx)
    throw new Error('useMultiAccount phải được dùng bên trong MultiAccountProvider');
  return ctx;
}

export { updateManagedAccount };

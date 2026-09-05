import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';

const STORAGE_KEY = 'volcano_managed_accounts';

export type ManagedAccount = {
  user_id: string;
  email: string;
  username: string;
  full_name: string;
  school: string;
  province: string;
  class_name: string;
  password: string;
  created_at: string;
  rank_points?: number;
  rank_tier?: string;
  streak_days?: number;
};

function readStore(): ManagedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ManagedAccount[];
  } catch {
    return [];
  }
}

function writeStore(accounts: ManagedAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function getManagedAccounts(): ManagedAccount[] {
  return readStore();
}

export function getActiveAccountId(): string | null {
  return localStorage.getItem('volcano_active_account');
}

export function setActiveAccountId(id: string | null): void {
  if (id === null) {
    localStorage.removeItem('volcano_active_account');
  } else {
    localStorage.setItem('volcano_active_account', id);
  }
}

export function addManagedAccount(account: ManagedAccount): void {
  const accounts = readStore();
  const existingIdx = accounts.findIndex((a) => a.user_id === account.user_id);
  if (existingIdx >= 0) {
    accounts[existingIdx] = { ...accounts[existingIdx], ...account };
  } else {
    accounts.push(account);
  }
  writeStore(accounts);
}

export function removeManagedAccount(userId: string): void {
  const accounts = readStore().filter((a) => a.user_id !== userId);
  writeStore(accounts);
  if (getActiveAccountId() === userId) {
    setActiveAccountId(null);
  }
}

export function updateManagedAccount(
  userId: string,
  updates: Partial<ManagedAccount>,
): void {
  const accounts = readStore();
  const idx = accounts.findIndex((a) => a.user_id === userId);
  if (idx >= 0) {
    accounts[idx] = { ...accounts[idx], ...updates };
    writeStore(accounts);
  }
}

export function findManagedAccount(userId: string): ManagedAccount | null {
  return readStore().find((a) => a.user_id === userId) ?? null;
}

export async function switchToAccount(
  account: ManagedAccount,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  setActiveAccountId(account.user_id);
  return { success: true };
}

export function syncProfileToManaged(profile: Profile): void {
  const existing = findManagedAccount(profile.id);
  if (!existing) return;
  updateManagedAccount(profile.id, {
    full_name: profile.full_name,
    school: profile.school,
    province: profile.province,
    class_name: profile.class_name,
    rank_points: profile.rank_points,
    rank_tier: profile.rank_tier,
    streak_days: profile.streak_days,
  });
}

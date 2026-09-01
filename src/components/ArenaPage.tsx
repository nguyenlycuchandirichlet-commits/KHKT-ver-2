import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { RANK_TIERS, getRankTier } from '@/lib/scoring';
import BlazingStreakCounter from '@/components/effects/BlazingStreakCounter';
import { Button } from '@/components/ui';
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  TrendingUp,
  Users,
  School,
  Loader2,
} from 'lucide-react';
import type { Page } from '@/lib/pages';

type RankEntry = {
  username: string;
  rank_tier: string;
  rank_points: number;
  streak_days: number;
  school: string;
  class_name: string;
};

export default function ArenaPage({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'all' | 'school' | 'class'>('all');

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rank_view')
      .select('*')
      .order('rank_points', { ascending: false })
      .limit(100);

    if (error) {
      console.error('load leaderboard failed', error);
      setEntries([]);
    } else {
      setEntries((data || []) as RankEntry[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const filtered = entries.filter((e) => {
    if (scope === 'school') return e.school === profile?.school;
    if (scope === 'class')
      return e.school === profile?.school && e.class_name === profile?.class_name;
    return true;
  });

  const myRank = filtered.findIndex((e) => e.username === profile?.username) + 1;
  const myTier = getRankTier(profile?.rank_points || 0);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Master': return <Crown className="h-4 w-4 text-purple-500" />;
      case 'Diamond': return <Trophy className="h-4 w-4 text-cyan-500" />;
      case 'Gold': return <Medal className="h-4 w-4 text-amber-500" />;
      case 'Silver': return <Medal className="h-4 w-4 text-slate-400" />;
      default: return <Medal className="h-4 w-4 text-amber-700" />;
    }
  };

  const getTierBadge = (tier: string) => {
    const t = RANK_TIERS.find((r) => r.tier === tier);
    if (!t) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    switch (tier) {
      case 'Master': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Diamond': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
      case 'Gold': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Silver': return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
      default: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Sân đấu nhận thức · Bảng xếp hạng ẩn danh
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
            Cognitive Arena
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Xếp hạng dựa trên điểm độc lập, độ gốc và chuỗi liên tục — không phải số từ.
          </p>
        </div>

        {/* My rank card */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 p-6 text-white shadow-lg animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${myTier.color}`}>
                {getTierIcon(myTier.tier)}
              </div>
              <div>
                <p className="text-xs text-brand-200/70">Hạng của bạn</p>
                <p className="text-2xl font-bold text-white">
                  {myRank > 0 ? `#${myRank}` : 'Chưa xếp hạng'}
                </p>
                <p className="text-sm font-bold text-white">
                  {myTier.slang}
                </p>
                <p className="text-xs text-brand-200/60">
                  {myTier.label} · {profile?.rank_points || 0} điểm
                </p>
              </div>
            </div>
            <div className="text-right">
              <BlazingStreakCounter streak={profile?.streak_days || 0} />
              <p className="mt-1 text-xs text-brand-200/60">Chuỗi liên tiếp</p>
            </div>
          </div>
        </div>

        {/* Tier legend */}
        <div className="mb-6 flex flex-wrap gap-2 animate-fade-in-up">
          {RANK_TIERS.map((t) => (
            <div
              key={t.tier}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${getTierBadge(t.tier)}`}
            >
              {getTierIcon(t.tier)}
              <span>{t.emoji}</span>
              {t.slang}
              <span className="opacity-60">· {t.min}+</span>
            </div>
          ))}
        </div>

        {/* Scope filter */}
        <div className="mb-6 flex gap-2 animate-fade-in-up">
          <ScopeButton active={scope === 'all'} onClick={() => setScope('all')} icon={<Users className="h-4 w-4" />} label="Tất cả" />
          <ScopeButton active={scope === 'school'} onClick={() => setScope('school')} icon={<School className="h-4 w-4" />} label="Trường tôi" />
          <ScopeButton active={scope === 'class'} onClick={() => setScope('class')} icon={<Users className="h-4 w-4" />} label="Lớp tôi" />
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white/80 p-12 dark:bg-slate-800/60">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white/80 p-8 text-center dark:bg-slate-800/60">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chưa có học sinh nào trong bảng xếp hạng này.
            </p>
            <Button variant="secondary" onClick={() => onNavigate('workspace')} className="mt-4">
              <TrendingUp className="h-4 w-4" />
              Làm bài để ghi danh
            </Button>
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in-up">
            {/* Podium top 3 */}
            {filtered.length >= 3 && scope === 'all' && (
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[1, 0, 2].map((idx) => {
                  const e = filtered[idx];
                  if (!e) return null;
                  const place = idx + 1;
                  const height = place === 1 ? 'h-28' : place === 2 ? 'h-20' : 'h-16';
                  const icon = place === 1 ? <Crown className="h-5 w-5 text-amber-400" /> : place === 2 ? <Medal className="h-5 w-5 text-slate-300" /> : <Medal className="h-5 w-5 text-amber-700" />;
                  const bg = place === 1 ? 'from-amber-400 to-yellow-600' : place === 2 ? 'from-slate-300 to-slate-500' : 'from-amber-700 to-orange-900';
                  return (
                    <div key={place} className="flex flex-col items-center">
                      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${bg} text-white shadow-lg`}>
                        {icon}
                      </div>
                      <p className="mb-1 max-w-full truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {e.username}
                      </p>
                      <p className="mb-2 text-xs text-slate-400">{e.rank_points} điểm</p>
                      <div className={`flex w-full ${height} items-center justify-center rounded-xl bg-gradient-to-t ${bg} opacity-90`}>
                        <span className="text-2xl font-bold text-white">{place}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            {filtered.map((e, i) => {
              const rank = i + 1;
              const isMe = e.username === profile?.username;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl p-3 transition ${
                    isMe
                      ? 'border-2 border-brand-400 bg-brand-50/50 dark:bg-brand-900/20'
                      : 'bg-white/80 dark:bg-slate-800/60'
                  } backdrop-blur-md`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      rank <= 3
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {e.username}
                      {isMe && <span className="ml-2 text-xs text-brand-600 dark:text-brand-400">(Bạn)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {e.school} · {e.class_name}
                    </p>
                  </div>
                  <BlazingStreakCounter streak={e.streak_days || 0} compact />
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTierBadge(e.rank_tier)}`}>
                    {e.rank_tier}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-slate-700 dark:text-slate-200">
                    {e.rank_points}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Privacy note */}
        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400 dark:bg-slate-800/40 dark:text-slate-500">
          Bảng xếp hạng sử dụng tên tài khoản ẩn danh — không hiển thị tên thật.
          Điểm xếp hạng dựa trên độc lập tư duy, độ gốc văn bản và chuỗi liên tục.
        </div>
      </div>
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-brand-500 text-white shadow-md'
          : 'bg-white/80 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
      } backdrop-blur-md`}
    >
      {icon}
      {label}
    </button>
  );
}

import { Flame } from 'lucide-react';

export default function BlazingStreakCounter({
  streak,
  compact = false,
}: {
  streak: number;
  compact?: boolean;
}) {
  if (streak <= 0) {
    return (
      <div className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
        <Flame className="h-4 w-4 text-slate-300 dark:text-slate-600" />
        <span className="font-medium text-slate-400 dark:text-slate-500">
          Chưa có chuỗi
        </span>
      </div>
    );
  }

  const isHot = streak >= 7;
  const isBlazing = streak >= 14;

  return (
    <div
      className={`group relative flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`}
    >
      {/* Flame with animated glow */}
      <div className="relative">
        <Flame
          className={`h-4 w-4 ${
            isBlazing
              ? 'animate-flame-flicker text-orange-500'
              : isHot
                ? 'animate-flame-glow text-orange-400'
                : 'text-orange-400'
          }`}
          fill={isHot ? 'currentColor' : 'none'}
        />
        {isBlazing && (
          <div className="absolute inset-0 -z-10 rounded-full bg-orange-500 blur-[6px] opacity-30 animate-flame-glow" />
        )}
      </div>

      {/* Streak number */}
      <span
        className={`font-extrabold ${
          isBlazing
            ? 'bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent'
            : isHot
              ? 'text-orange-500 dark:text-orange-400'
              : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        {streak}
      </span>
      <span className="text-slate-400 dark:text-slate-500">ngày</span>

      {/* Blazing badge */}
      {isBlazing && (
        <span className="ml-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
          BLAZING
        </span>
      )}
      {!isBlazing && isHot && (
        <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
          HOT
        </span>
      )}
    </div>
  );
}

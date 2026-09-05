import { sanitizeYAxisTicks } from '@/lib/scoring';

type VocabSegment = {
  label: string;
  common: number;
  critical: number;
};

export default function StackedBarChart({
  segments,
}: {
  segments: VocabSegment[];
}) {
  const barWidth = 48;
  const gap = 24;
  const chartHeight = 200;
  const maxTotal = Math.max(
    ...segments.map((s) => s.common + s.critical),
    1,
  );
  const totalWidth = segments.length * (barWidth + gap) + 40;

  // Sanitized Y-axis ticks: strict integers, clean step intervals, zero overlap
  const yTicks = sanitizeYAxisTicks(maxTotal, 5);
  const niceMax = yTicks[yTicks.length - 1] || 1;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${chartHeight + 50}`}
      className="w-full"
      style={{ maxWidth: totalWidth }}
    >
      <defs>
        <linearGradient id="commonGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(251,191,36,0.9)" />
          <stop offset="100%" stopColor="rgba(245,158,11,0.6)" />
        </linearGradient>
        <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(59,130,246,0.9)" />
          <stop offset="100%" stopColor="rgba(37,99,235,0.6)" />
        </linearGradient>
      </defs>

      {/* Y-axis grid lines with sanitized integer ticks */}
      {yTicks.map((tickVal, i) => {
        const ratio = tickVal / niceMax;
        const y = chartHeight - ratio * chartHeight + 10;
        return (
          <g key={i}>
            <line
              x1={30}
              y1={y}
              x2={totalWidth - 10}
              y2={y}
              stroke="rgba(148,163,184,0.15)"
              strokeWidth={1}
            />
            <text
              x={24}
              y={y + 4}
              textAnchor="end"
              className="fill-slate-400 dark:fill-slate-500"
              style={{ fontSize: 9 }}
            >
              {tickVal}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {segments.map((seg, i) => {
        const x = 35 + i * (barWidth + gap);
        const commonH = (seg.common / niceMax) * chartHeight;
        const criticalH = (seg.critical / niceMax) * chartHeight;
        const totalH = commonH + criticalH;
        const baseY = chartHeight + 10;

        return (
          <g key={i}>
            {/* Critical (bottom) */}
            <rect
              x={x}
              y={baseY - totalH}
              width={barWidth}
              height={criticalH}
              rx={6}
              fill="url(#criticalGrad)"
            />
            {/* Common (top) */}
            <rect
              x={x}
              y={baseY - commonH}
              width={barWidth}
              height={commonH}
              rx={6}
              fill="url(#commonGrad)"
            />
            {/* Label */}
            <text
              x={x + barWidth / 2}
              y={baseY + 18}
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {seg.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

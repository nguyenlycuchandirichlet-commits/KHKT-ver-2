import { sanitizeYAxisTicks } from '@/lib/scoring';

type ScatterPoint = {
  x: number; // idle seconds
  y: number; // word count or depth
  label?: string;
  idle: number;
  depth: number;
};

export default function ScatterChart({
  points,
  yLabel = 'Điểm chiều sâu',
}: {
  points: ScatterPoint[];
  yLabel?: string;
}) {
  const width = 360;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxX = Math.max(...points.map((p) => p.x), 60);
  const maxY = Math.max(...points.map((p) => p.y), 100);

  // Sanitized Y-axis ticks
  const yTicks = sanitizeYAxisTicks(maxY, 5);
  const niceMaxY = yTicks[yTicks.length - 1] || 100;

  const scaleX = (v: number) =>
    padding.left + (v / maxX) * chartW;
  const scaleY = (v: number) =>
    padding.top + chartH - (v / niceMaxY) * chartH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[360px]">
      <defs>
        <radialGradient id="pointGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(59,130,246,0.8)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0)" />
        </radialGradient>
      </defs>

      {/* Grid + sanitized Y-axis integer ticks */}
      {yTicks.map((tickVal, i) => {
        const y = scaleY(tickVal);
        return (
          <g key={`h${i}`}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="rgba(148,163,184,0.12)"
              strokeWidth={1}
            />
            <text
              x={padding.left - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-slate-400 dark:fill-slate-500"
              style={{ fontSize: 9 }}
            >
              {tickVal}
            </text>
          </g>
        );
      })}
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
        <line
          key={`v${i}`}
          x1={padding.left + r * chartW}
          y1={padding.top}
          x2={padding.left + r * chartW}
          y2={padding.top + chartH}
          stroke="rgba(148,163,184,0.12)"
          strokeWidth={1}
        />
      ))}

      {/* Axis labels */}
      <text
        x={width / 2}
        y={height - 5}
        textAnchor="middle"
        className="fill-slate-500 dark:fill-slate-400"
        style={{ fontSize: 10, fontWeight: 600 }}
      >
        Thời gian ngưng gõ (giây)
      </text>
      <text
        x={12}
        y={height / 2}
        textAnchor="middle"
        transform={`rotate(-90, 12, ${height / 2})`}
        className="fill-slate-500 dark:fill-slate-400"
        style={{ fontSize: 10, fontWeight: 600 }}
      >
        {yLabel}
      </text>

      {/* Threshold line for expressive paralysis */}
      {points.length > 0 && (
        <line
          x1={scaleX(30)}
          y1={padding.top}
          x2={scaleX(30)}
          y2={padding.top + chartH}
          stroke="rgba(239,68,68,0.3)"
          strokeWidth={1.5}
          strokeDasharray="5 3"
        />
      )}

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={scaleX(p.x)}
            cy={scaleY(p.y)}
            r={12}
            fill="url(#pointGlow)"
          />
          <circle
            cx={scaleX(p.x)}
            cy={scaleY(p.y)}
            r={5}
            fill={p.x > 30 ? 'rgb(239,68,68)' : 'rgb(59,130,246)'}
            stroke="white"
            strokeWidth={1.5}
          >
            <title>{`${p.label || ''}: ${p.x}s ngưng, ${p.y} điểm chiều sâu`}</title>
          </circle>
        </g>
      ))}

      {points.length === 0 && (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          className="fill-slate-400 dark:fill-slate-500"
          style={{ fontSize: 12 }}
        >
          Chưa có dữ liệu
        </text>
      )}
    </svg>
  );
}

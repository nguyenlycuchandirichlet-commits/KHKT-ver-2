import type { Scores } from '@/lib/scoring';

const AXES: { key: keyof Scores; label: string }[] = [
  { key: 'depth', label: 'Chiều sâu' },
  { key: 'fluency', label: 'Trôi chảy' },
  { key: 'independence', label: 'Độc lập' },
  { key: 'vocabularyCoherence', label: 'Từ vựng' },
  { key: 'speed', label: 'Tốc độ' },
];

const BENCHMARK: Scores = {
  depth: 55,
  fluency: 60,
  independence: 50,
  vocabularyCoherence: 52,
  speed: 58,
};

export default function RadarChart({ scores }: { scores: Scores }) {
  const size = 340;
  const center = size / 2;
  const maxRadius = 120;
  const levels = 5;

  const pointAt = (angle: number, radius: number) => ({
    x: center + Math.cos(angle - Math.PI / 2) * radius,
    y: center + Math.sin(angle - Math.PI / 2) * radius,
  });

  const dataPoints = AXES.map((axis, i) => {
    const angle = (i / AXES.length) * Math.PI * 2;
    const value = scores[axis.key] || 0;
    const r = (value / 100) * maxRadius;
    return { ...pointAt(angle, r), angle, label: axis.label, value };
  });

  const benchPoints = AXES.map((axis, i) => {
    const angle = (i / AXES.length) * Math.PI * 2;
    const r = (BENCHMARK[axis.key] / 100) * maxRadius;
    return pointAt(angle, r);
  });

  const polygon = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[340px]">
      {/* Concentric polygons */}
      {Array.from({ length: levels }, (_, i) => {
        const r = ((i + 1) / levels) * maxRadius;
        const pts = AXES.map((_, j) => {
          const angle = (j / AXES.length) * Math.PI * 2;
          return pointAt(angle, r);
        });
        return (
          <polygon
            key={i}
            points={polygon(pts)}
            fill="none"
            stroke="rgba(148,163,184,0.2)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {AXES.map((_, i) => {
        const angle = (i / AXES.length) * Math.PI * 2;
        const p = pointAt(angle, maxRadius);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="rgba(148,163,184,0.2)"
            strokeWidth={1}
          />
        );
      })}

      {/* Benchmark polygon */}
      <polygon
        points={polygon(benchPoints)}
        fill="rgba(148,163,184,0.12)"
        stroke="rgba(148,163,184,0.4)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* Student polygon */}
      <defs>
        <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(59,130,246,0.35)" />
          <stop offset="100%" stopColor="rgba(37,99,235,0.15)" />
        </linearGradient>
      </defs>
      <polygon
        points={polygon(dataPoints)}
        fill="url(#radarGrad)"
        stroke="rgb(59,130,246)"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="rgb(59,130,246)"
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {dataPoints.map((p, i) => {
        const angle = (i / AXES.length) * Math.PI * 2;
        const labelPos = pointAt(angle, maxRadius + 22);
        return (
          <g key={i}>
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-600 dark:fill-slate-300"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              {p.label}
            </text>
            <text
              x={labelPos.x}
              y={labelPos.y + 13}
              textAnchor="middle"
              className="fill-brand-600 dark:fill-brand-400"
              style={{ fontSize: 10, fontWeight: 700 }}
            >
              {p.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

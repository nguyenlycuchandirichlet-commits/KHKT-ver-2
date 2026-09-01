import { useMemo } from 'react';

type Ember = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
};

type Smoke = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
};

const EMBER_COLORS = ['#f97316', '#ef4444', '#fbbf24', '#fb923c', '#dc2626'];

function generateEmbers(count: number): Ember[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3,
    size: 2 + Math.random() * 4,
    color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
  }));
}

function generateSmoke(count: number): Smoke[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 5 + Math.random() * 3,
    size: 40 + Math.random() * 60,
  }));
}

export default function VolcanoParticleFX({
  intensity = 'medium',
}: {
  intensity?: 'low' | 'medium' | 'high';
}) {
  const emberCount = intensity === 'high' ? 30 : intensity === 'medium' ? 18 : 8;
  const smokeCount = intensity === 'high' ? 8 : intensity === 'medium' ? 5 : 3;

  const embers = useMemo(() => generateEmbers(emberCount), [emberCount]);
  const smoke = useMemo(() => generateSmoke(smokeCount), [smokeCount]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Lava glow at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 animate-lava-pulse"
        style={{
          background:
            'radial-gradient(ellipse at center bottom, rgba(249,115,22,0.25) 0%, rgba(239,68,68,0.1) 40%, transparent 70%)',
        }}
      />

      {/* Rising smoke */}
      {smoke.map((s) => (
        <div
          key={`smoke-${s.id}`}
          className="absolute bottom-10 animate-smoke-drift"
          style={{
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(100,116,139,0.15) 0%, transparent 70%)',
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* Rising embers */}
      {embers.map((e) => (
        <div
          key={`ember-${e.id}`}
          className="absolute bottom-10 animate-ember-rise"
          style={{
            left: `${e.left}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            borderRadius: '50%',
            backgroundColor: e.color,
            boxShadow: `0 0 6px ${e.color}, 0 0 12px ${e.color}`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export function LavaBurstEffect({ trigger }: { trigger: boolean }) {
  const particles = useMemo(() => {
    if (!trigger) return [];
    return Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * Math.PI * 2;
      const distance = 60 + Math.random() * 100;
      return {
        id: i,
        bx: Math.cos(angle) * distance,
        by: -Math.abs(Math.sin(angle) * distance) - 20,
        color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
        size: 4 + Math.random() * 6,
      };
    });
  }, [trigger]);

  if (!trigger) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-lava-burst"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}`,
            ['--bx' as string]: `${p.bx}px`,
            ['--by' as string]: `${p.by}px`,
          }}
        />
      ))}
    </div>
  );
}

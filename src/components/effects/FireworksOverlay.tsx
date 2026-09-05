import { useEffect, useState, useMemo } from 'react';

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'star';
  rotate: number;
};

const CONFETTI_COLORS = [
  '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#f97316',
  '#eab308', '#14b8a6',
];

const FIREWORK_COLORS = [
  '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6',
];

function generateConfetti(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2.5 + Math.random() * 1.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 8,
    shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
    rotate: Math.random() * 360,
  }));
}

function generateFireworkBurst(originX: number, originY: number, idBase: number) {
  const particles = 18;
  return Array.from({ length: particles }, (_, i) => {
    const angle = (i / particles) * Math.PI * 2;
    const distance = 80 + Math.random() * 120;
    return {
      id: idBase + i,
      left: originX,
      top: originY,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
      delay: Math.random() * 0.3,
    };
  });
}

type FireworkParticle = {
  id: number;
  left: number;
  top: number;
  tx: number;
  ty: number;
  color: string;
  delay: number;
};

export default function FireworksOverlay({
  trigger,
  onDone,
}: {
  trigger: boolean;
  onDone?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [confetti, setConfetti] = useState<Particle[]>([]);
  const [fireworks, setFireworks] = useState<FireworkParticle[]>([]);

  const fireworkBursts = useMemo(() => {
    if (!visible) return [] as FireworkParticle[];
    const bursts: FireworkParticle[] = [];
    let idCounter = 0;
    const origins = [
      { x: 20, y: 30 },
      { x: 50, y: 20 },
      { x: 80, y: 35 },
      { x: 35, y: 50 },
      { x: 65, y: 45 },
    ];
    for (const origin of origins) {
      bursts.push(...generateFireworkBurst(origin.x, origin.y, idCounter));
      idCounter += 20;
    }
    return bursts;
  }, [visible]);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      setConfetti(generateConfetti(60));
      setFireworks(fireworkBursts);

      // Play a chill audio cue using Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const now = audioCtx.currentTime;

        // Triumphant chord: C-E-G major arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.value = freq;
          osc.type = 'triangle';
          const start = now + i * 0.12;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
          osc.start(start);
          osc.stop(start + 0.8);
        });
      } catch {
        // Audio not available — silent fail
      }

      const timer = setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [trigger, fireworkBursts, onDone]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Firework bursts */}
      {fireworks.map((p) => (
        <div
          key={`fw-${p.id}`}
          className="absolute animate-firework"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            ['--tx' as string]: `${p.tx}px`,
            ['--ty' as string]: `${p.ty}px`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: p.color,
              boxShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}`,
            }}
          />
        </div>
      ))}

      {/* Confetti rain */}
      {confetti.map((p) => (
        <div
          key={`cf-${p.id}`}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.shape === 'circle' && (
            <div
              className="rounded-full"
              style={{ width: '100%', height: '100%', backgroundColor: p.color }}
            />
          )}
          {p.shape === 'square' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: p.color,
                transform: `rotate(${p.rotate}deg)`,
              }}
            />
          )}
          {p.shape === 'star' && (
            <div
              style={{
                width: '0',
                height: '0',
                color: p.color,
                fontSize: `${p.size}px`,
                lineHeight: 1,
              }}
            >
              ★
            </div>
          )}
        </div>
      ))}

      {/* Central glow flash */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)',
          animation: 'firework 1s ease-out forwards',
        }}
      />
    </div>
  );
}

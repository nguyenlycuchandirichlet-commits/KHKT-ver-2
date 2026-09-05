import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  sides: number;
  hue: number;
};

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  size: number;
};

type TwinkleStar = {
  x: number;
  y: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  size: number;
  hue: number;
};

/**
 * Nền canvas tương tác: sao băng lớn + điểm sáng nhấp nháy + hạt tinh thể
 * phản ứng với chuyển động của con trỏ chuột.
 */
export default function InteractiveBackground({
  isDark,
}: {
  isDark: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const darkRef = useRef(isDark);

  useEffect(() => {
    darkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animationId = 0;

    const particleCount = Math.min(
      55,
      Math.floor((width * height) / 28000),
    );
    const twinkleCount = Math.min(
      140,
      Math.floor((width * height) / 11000),
    );
    const particles: Particle[] = [];
    const stars: ShootingStar[] = [];
    const twinkles: TwinkleStar[] = [];

    const createParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 6 + Math.random() * 14,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      opacity: 0.15 + Math.random() * 0.35,
      sides: [3, 4, 6][Math.floor(Math.random() * 3)],
      hue: 200 + Math.random() * 40,
    });

    const createTwinkle = (): TwinkleStar => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseAlpha: 0.2 + Math.random() * 0.6,
      twinkleSpeed: 0.01 + Math.random() * 0.04,
      twinklePhase: Math.random() * Math.PI * 2,
      size: 0.6 + Math.random() * 2.2,
      hue: 200 + Math.random() * 60,
    });

    for (let i = 0; i < particleCount; i++) particles.push(createParticle());
    for (let i = 0; i < twinkleCount; i++) twinkles.push(createTwinkle());

    const spawnShootingStar = (big = false) => {
      const fromLeft = Math.random() > 0.5;
      const startY = Math.random() * height * 0.7;
      const speed = big ? 14 + Math.random() * 10 : 8 + Math.random() * 6;
      const angle = Math.PI * 0.16 + Math.random() * 0.16;
      stars.push({
        x: fromLeft ? -80 : width + 80,
        y: startY,
        vx: fromLeft ? Math.cos(angle) * speed : -Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: big ? 200 + Math.random() * 200 : 80 + Math.random() * 120,
        life: 0,
        maxLife: big ? 90 + Math.random() * 50 : 60 + Math.random() * 40,
        size: big ? 3.5 + Math.random() * 2 : 1.8,
      });
    };

    let starTimer = 0;
    let bigStarTimer = 0;

    const drawPolygon = (
      x: number,
      y: number,
      radius: number,
      sides: number,
      rotation: number,
    ) => {
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = rotation + (i / sides) * Math.PI * 2;
        const px = x + Math.cos(a) * radius;
        const py = y + Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const render = () => {
      const dark = darkRef.current;
      ctx.clearRect(0, 0, width, height);

      // Nền gradient nhẹ
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) / 1.2,
      );
      if (dark) {
        grad.addColorStop(0, 'rgba(15,23,42,1)');
        grad.addColorStop(1, 'rgba(2,6,23,1)');
      } else {
        grad.addColorStop(0, 'rgba(248,250,252,1)');
        grad.addColorStop(1, 'rgba(226,232,240,1)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Điểm sáng nhấp nháy (twinkling stars)
      for (const t of twinkles) {
        t.twinklePhase += t.twinkleSpeed;
        const twinkle = 0.5 + 0.5 * Math.sin(t.twinklePhase);
        const alpha = t.baseAlpha * (0.3 + twinkle * 0.7);
        const r = t.size * (0.8 + twinkle * 0.4);

        // Quầng sáng
        const glow = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, r * 6);
        const hueColor = dark
          ? `hsla(${t.hue},90%,80%,`
          : `hsla(${t.hue},70%,55%,`;
        glow.addColorStop(0, `${hueColor}${alpha * 0.5})`);
        glow.addColorStop(1, `${hueColor}0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(t.x, t.y, r * 6, 0, Math.PI * 2);
        ctx.fill();

        // Lõi sáng
        ctx.beginPath();
        ctx.fillStyle = dark
          ? `rgba(255,255,255,${alpha})`
          : `rgba(255,255,255,${alpha * 0.7})`;
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const mouse = mouseRef.current;

      // Hạt tinh thể
      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (mouse.active && dist < 160) {
          const force = (160 - dist) / 160;
          p.vx += (dx / dist) * force * 0.4;
          p.vy += (dy / dist) * force * 0.4;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;

        if (p.x < -40) p.x = width + 40;
        if (p.x > width + 40) p.x = -40;
        if (p.y < -40) p.y = height + 40;
        if (p.y > height + 40) p.y = -40;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.strokeStyle = dark
          ? `hsla(${p.hue},80%,75%,0.8)`
          : `hsla(${p.hue},70%,55%,0.7)`;
        ctx.fillStyle = dark
          ? `hsla(${p.hue},80%,65%,0.08)`
          : `hsla(${p.hue},70%,60%,0.06)`;
        ctx.lineWidth = 1.2;
        drawPolygon(p.x, p.y, p.size, p.sides, p.rotation);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Sao băng thường
      starTimer++;
      if (starTimer > 30 && Math.random() < 0.04) {
        spawnShootingStar(false);
        starTimer = 0;
      }

      // Sao băng lớn
      bigStarTimer++;
      if (bigStarTimer > 180 && Math.random() < 0.025) {
        spawnShootingStar(true);
        bigStarTimer = 0;
      }

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        const fade = Math.min(1, (s.maxLife - s.life) / 25);
        const headAlpha = Math.max(0, fade);

        const tailX = s.x - s.vx * (s.length / 10);
        const tailY = s.y - s.vy * (s.length / 10);
        const tg = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        tg.addColorStop(0, `rgba(255,255,255,${0.95 * headAlpha})`);
        tg.addColorStop(0.3, `rgba(191,219,254,${0.6 * headAlpha})`);
        tg.addColorStop(1, 'rgba(96,165,250,0)');
        ctx.strokeStyle = tg;
        ctx.lineWidth = s.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Quầng sáng đầu sao băng
        const headGlow = ctx.createRadialGradient(
          s.x,
          s.y,
          0,
          s.x,
          s.y,
          s.size * 5,
        );
        headGlow.addColorStop(
          0,
          `rgba(255,255,255,${0.8 * headAlpha})`,
        );
        headGlow.addColorStop(
          0.4,
          `rgba(147,197,253,${0.3 * headAlpha})`,
        );
        headGlow.addColorStop(1, 'rgba(96,165,250,0)');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 5, 0, Math.PI * 2);
        ctx.fill();

        // Lõi đầu sáng
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${0.95 * headAlpha})`;
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        if (
          s.life > s.maxLife ||
          s.x < -150 ||
          s.x > width + 150 ||
          s.y > height + 150
        ) {
          stars.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          active: true,
        };
      }
    };
    const handleTouchEnd = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    />
  );
}

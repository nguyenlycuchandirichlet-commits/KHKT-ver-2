/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#172554',
        },
        slate: {
          950: '#020617',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        glow: 'glow 3s ease-in-out infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'pulse-red': 'pulseRed 0.6s ease-in-out infinite',
        'firework': 'firework 1.2s ease-out forwards',
        'confetti-fall': 'confettiFall 3s linear forwards',
        'flame-flicker': 'flameFlicker 0.8s ease-in-out infinite alternate',
        'flame-glow': 'flameGlow 1.5s ease-in-out infinite alternate',
        'emoji-pop': 'emojiPop 0.6s cubic-bezier(.34,1.56,.64,1) forwards',
        'ember-rise': 'emberRise 4s linear infinite',
        'smoke-drift': 'smokeDrift 6s ease-out infinite',
        'lava-pulse': 'lavaPulse 2s ease-in-out infinite alternate',
        'screen-shake': 'screenShake 0.4s cubic-bezier(.36,.07,.19,.97) both',
        'lava-burst': 'lavaBurst 1.2s ease-out forwards',
        'chain-rattle': 'chainRattle 0.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { textShadow: '0 0 20px rgba(96,165,250,0.4)' },
          '100%': { textShadow: '0 0 40px rgba(96,165,250,0.7)' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-2px)' },
          '20%, 80%': { transform: 'translateX(4px)' },
          '30%, 50%, 70%': { transform: 'translateX(-8px)' },
          '40%, 60%': { transform: 'translateX(8px)' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' },
        },
        firework: {
          '0%': { transform: 'translate(0,0) scale(0)', opacity: 1 },
          '50%': { transform: 'translate(var(--tx), var(--ty)) scale(1)', opacity: 1 },
          '100%': { transform: 'translate(var(--tx), calc(var(--ty) + 60px)) scale(0.3)', opacity: 0 },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: 0 },
        },
        flameFlicker: {
          '0%': { transform: 'scale(1) rotate(-2deg)', filter: 'brightness(1)' },
          '100%': { transform: 'scale(1.15) rotate(2deg)', filter: 'brightness(1.3)' },
        },
        flameGlow: {
          '0%': { filter: 'drop-shadow(0 0 4px rgba(251,146,60,0.4))' },
          '100%': { filter: 'drop-shadow(0 0 12px rgba(251,146,60,0.8))' },
        },
        emojiPop: {
          '0%': { transform: 'scale(0) rotate(-20deg)', opacity: 0 },
          '60%': { transform: 'scale(1.3) rotate(10deg)', opacity: 1 },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
        },
        emberRise: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: 0.8 },
          '50%': { opacity: 0.6 },
          '100%': { transform: 'translateY(-120px) scale(0.3)', opacity: 0 },
        },
        smokeDrift: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: 0.3 },
          '100%': { transform: 'translateY(-80px) scale(1.5)', opacity: 0 },
        },
        lavaPulse: {
          '0%': { opacity: 0.4, filter: 'brightness(1)' },
          '100%': { opacity: 0.7, filter: 'brightness(1.4)' },
        },
        screenShake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '20%': { transform: 'translate(-4px, 2px)' },
          '40%': { transform: 'translate(4px, -2px)' },
          '60%': { transform: 'translate(-3px, -1px)' },
          '80%': { transform: 'translate(3px, 1px)' },
        },
        lavaBurst: {
          '0%': { transform: 'translate(0, 0) scale(0.5)', opacity: 1 },
          '50%': { transform: 'translate(var(--bx), var(--by)) scale(1.2)', opacity: 1 },
          '100%': { transform: 'translate(var(--bx), calc(var(--by) + 40px)) scale(0.3)', opacity: 0 },
        },
        chainRattle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
};

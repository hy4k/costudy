/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './App.tsx', './index.tsx', './components/**/*.{tsx,ts,jsx,js}', './lib/**/*.{ts,tsx}', './services/**/*.{tsx,ts,jsx,js}'],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
      fontFamily: {
        sans: ['Geist', 'Geist Sans', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
        display: ['Syne', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'neon-red': '0 0 20px rgba(239,68,68,0.5), 0 0 40px rgba(239,68,68,0.3)',
        'neon-emerald': '0 0 20px rgba(16,185,129,0.5), 0 0 40px rgba(16,185,129,0.3)',
        'neon-amber': '0 0 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.3)',
        'neon-cyan': '0 0 20px rgba(6,182,212,0.5), 0 0 40px rgba(6,182,212,0.3)',
      },
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand-500)',
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};

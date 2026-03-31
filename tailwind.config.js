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
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
        display: ['Fraunces', 'Georgia', 'ui-serif', 'serif'],
      },
      boxShadow: {
        neomorph:
          '6px 6px 14px rgba(15, 23, 42, 0.07), -5px -5px 14px rgba(255, 255, 255, 0.85)',
        'neomorph-sm':
          '4px 4px 10px rgba(15, 23, 42, 0.06), -3px -3px 10px rgba(255, 255, 255, 0.9)',
        'neomorph-inset':
          'inset 3px 3px 8px rgba(15, 23, 42, 0.12), inset -2px -2px 8px rgba(255, 255, 255, 0.65)',
        'neomorph-inset-light':
          'inset 2px 2px 6px rgba(15, 23, 42, 0.08), inset -2px -2px 6px rgba(255, 255, 255, 0.95)',
        glass: '0 8px 32px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        luxury:
          '0 32px 64px -16px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.75)',
        'luxury-sm': '0 12px 40px -8px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5)',
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

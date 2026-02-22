/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
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
                    deep: '#0a0e1a',
                    card: '#111827',
                    dark: '#0f172a',
                },
                accent: {
                    indigo: '#6366f1',
                    emerald: '#10b981',
                    red: '#ef4444',
                    amber: '#f59e0b',
                    cyan: '#06b6d4',
                    pink: '#ec4899',
                },
                signal: {
                    green: '#10b981',
                    red: '#ef4444',
                    amber: '#f59e0b',
                }
            }
        }
    },
    plugins: [],
}

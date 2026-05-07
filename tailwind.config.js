/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: "#070707",
          alt: "#0d0d0d",
        },
        ink: {
          DEFAULT: "#f5f5f0",
          dim: "#9a9a92",
          faint: "#4a4a44",
        },
        signal: {
          DEFAULT: "#FFD633",
          alt: "#ffb800",
        },
        line: {
          DEFAULT: "rgba(255,214,51,.14)",
          soft: "rgba(255,255,255,.06)",
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'Syne'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      letterSpacing: {
        signal: "0.18em",
        wide2: "0.25em",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090D16',
          surface: '#0F1626',
          card: '#151E32',
          border: '#202D49',
          hover: '#1B2640',
        },
        athletic: {
          cyan: '#00F0FF',
          crimson: '#FF2D55',
          emerald: '#00E676',
          amber: '#FFB800',
          purple: '#A855F7',
          blue: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(0, 240, 255, 0.3)',
        'glow-crimson': '0 0 20px -5px rgba(255, 45, 85, 0.3)',
        'glow-emerald': '0 0 20px -5px rgba(0, 230, 118, 0.3)',
      },
    },
  },
  plugins: [],
}

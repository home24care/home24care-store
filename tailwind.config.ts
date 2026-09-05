import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#12211c',
          soft: '#3d4f47',
          muted: '#6b7c74',
        },
        moss: {
          50: '#f2f7f3',
          100: '#e0ebe2',
          200: '#c2d7c7',
          300: '#95b89f',
          400: '#639374',
          500: '#417456',
          600: '#2f5c43',
          700: '#274a37',
          800: '#213b2d',
          900: '#1c3126',
        },
        clay: {
          50: '#fdf6ef',
          100: '#f8e8d6',
          200: '#f0cdaa',
          300: '#e6ab76',
          400: '#dc8848',
          500: '#d46f2c',
          600: '#c25822',
          700: '#a1421f',
          800: '#813620',
          900: '#692e1d',
        },
        sand: '#faf7f2',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,33,28,.06), 0 8px 24px -12px rgba(18,33,28,.18)',
        lift: '0 2px 4px rgba(18,33,28,.06), 0 18px 40px -16px rgba(18,33,28,.28)',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in .28s cubic-bezier(.32,.72,0,1)',
        'slide-in-left': 'slide-in-left .28s cubic-bezier(.32,.72,0,1)',
        'fade-in': 'fade-in .2s ease-out',
        rise: 'rise .35s cubic-bezier(.32,.72,0,1) both',
      },
    },
  },
  plugins: [],
};

export default config;

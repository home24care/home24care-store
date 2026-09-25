import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1b1f1c',
          soft: '#454b47',
          muted: '#767d78',
        },
        /* Brand green, sampled from the hobby-shop references (#79b38a). */
        moss: {
          50: '#f1f8f3',
          100: '#e1f0e6',
          200: '#c3e1cc',
          300: '#9fcdad',
          400: '#79b38a',
          500: '#5f9a70',
          600: '#4a8159',
          700: '#3d6949',
          800: '#2f5139',
          900: '#1f2a24',
        },
        /* Collector gold, for eyebrows on dark panels and hit badges. */
        clay: {
          50: '#fbf6ea',
          100: '#f5e8c7',
          200: '#ecd394',
          300: '#e2bb5f',
          400: '#d9a83d',
          500: '#c8922a',
          600: '#ad7722',
          700: '#8c5b1f',
          800: '#744a20',
          900: '#623e1f',
        },
        sand: '#f6f6f4',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,31,28,.06), 0 8px 24px -12px rgba(27,31,28,.18)',
        lift: '0 2px 4px rgba(27,31,28,.06), 0 18px 40px -16px rgba(27,31,28,.28)',
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
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
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
        marquee: 'marquee 38s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

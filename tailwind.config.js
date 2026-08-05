/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#090A0F',
        surface: '#12151E',
        'surface-2': '#191D29',
        neon: {
          cyan: '#00F0FF',
          violet: '#7000FF',
          mint: '#3DFFC2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px 0 rgba(0,240,255,0.35)',
        'glow-violet': '0 0 28px 0 rgba(112,0,255,0.45)',
        'glow-soft': '0 0 18px 0 rgba(0,240,255,0.18)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.6)', opacity: '0.9' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'scan-beam': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'dash-flow': {
          to: { strokeDashoffset: '-24' },
        },
        'float-slow': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.215,0.61,0.355,1) infinite',
        'scan-beam': 'scan-beam 2.4s linear infinite',
        'dash-flow': 'dash-flow 1.2s linear infinite',
        'float-slow': 'float-slow 4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};

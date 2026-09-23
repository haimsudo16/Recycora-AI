/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07090a',
          900: '#0c0f0e',
          850: '#101412',
          800: '#151a17',
          700: '#1d2420',
          600: '#28312b',
          500: '#3a453d',
        },
        forest: {
          950: '#031a12',
          900: '#052a1c',
          800: '#0a3d29',
          700: '#0f5236',
          600: '#166b46',
          500: '#1f8558',
          400: '#33a06d',
        },
        emerald: {
          400: '#4fd68f',
          300: '#7ee6ac',
        },
        lime: {
          400: '#c8f169',
          300: '#daf797',
        },
        offwhite: '#f3f5f0',
        mist: '#c9d1c7',
      },
      fontFamily: {
        display: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backgroundImage: {
        'radial-fade': 'radial-gradient(60% 60% at 50% 0%, rgba(79,214,143,0.14) 0%, rgba(7,9,10,0) 70%)',
        'grid-lines': 'linear-gradient(rgba(201,209,199,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,209,199,0.06) 1px, transparent 1px)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(79, 214, 143, 0.15)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        scanline: 'scanline 2.2s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
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
          950: '#020617',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          glow: '#a78bfa',
          deep: '#6d28d9',
        },
        success: '#10b981',
        danger: '#ef4444',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pop': 'pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ripple': 'ripple 600ms ease-out',
        'shake': 'shake 360ms cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'shine': 'shine 1.5s ease-in-out',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0.4)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-2px)' },
          '20%, 80%': { transform: 'translateX(3px)' },
          '30%, 50%, 70%': { transform: 'translateX(-5px)' },
          '40%, 60%': { transform: 'translateX(5px)' },
        },
        shine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

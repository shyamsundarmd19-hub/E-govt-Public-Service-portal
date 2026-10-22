/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e5ece5',
          200: '#cbdacb',
          300: '#a6c0a6',
          400: '#7fa17f',
          500: '#628562',
          600: '#4c6a4c',
          700: '#3d543d',
          800: '#334433',
          900: '#2b392b',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft-mint': '0 4px 20px -2px rgba(5, 150, 105, 0.08), 0 2px 6px -1px rgba(5, 150, 105, 0.04)',
        'card-glow': '0 0 0 1px rgba(167, 243, 208, 0.6), 0 4px 16px -2px rgba(6, 78, 59, 0.05)',
      }
    },
  },
  plugins: [],
}

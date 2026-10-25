/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      colors: {
        paper: '#f7f4ee',
        card: '#fffdf9',
        ink: { DEFAULT: '#26231f', soft: '#5f5a52', faint: '#8d877c' },
        line: '#e8e2d6',
        accent: { DEFAULT: '#c2562f', soft: '#f7e6dc', deep: '#9a3f1e' },
        moss: { DEFAULT: '#4f7a5a', soft: '#e3eee5' },
        sky: { soft: '#e3edf5', DEFAULT: '#3f6d93' },
        sand: '#efe9dc',
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: { soft: '0 1px 2px rgba(60,40,20,.05)', lift: '0 6px 20px -8px rgba(60,40,20,.18)' },
      keyframes: {
        rise: { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { rise: 'rise .28s ease-out both' },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6F0',
        sand: '#F1E7D8',
        line: '#E6D9C6',
        espresso: '#1C130E',
        teak: { DEFAULT: '#6E3F22', dark: '#4B2813' },
        wood: '#A77442',
        bark: '#231812',
        muted: '#6D5D50',
        sage: '#3F6A4B',
        gold: { DEFAULT: '#C69B3A', light: '#E6C97A', dark: '#946F1D' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,19,14,.04), 0 10px 28px -14px rgba(28,19,14,.16)',
        lift: '0 4px 10px rgba(28,19,14,.06), 0 24px 48px -18px rgba(28,19,14,.28)',
        gold: '0 8px 28px -10px rgba(198,155,58,.38)',
      },
    },
  },
  plugins: [],
}

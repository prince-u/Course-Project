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
        sys: {
          bg: 'var(--color-bg)',
          card: 'var(--color-card)',
          border: 'var(--color-border)',
          text: 'var(--color-text)',
          muted: 'var(--color-muted)'
        },
        biomass: '#22c55e',
        gas: '#f97316',
        steam: '#0ea5e9',
        danger: '#ef4444'
      }
    },
  },
  plugins: [],
}

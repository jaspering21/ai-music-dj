/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dj: {
          dark: '#1a1a2e',
          primary: '#16213e',
          accent: '#e94560',
          gold: '#f5c518'
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#0F1421',
        'gold-accent': '#FFD700', 
        'silver-text': '#E8E8E8',
        'neon-green': '#00FF9D',
        'dark-red': '#FF375F',
      },
    },
  },
  plugins: [],
}
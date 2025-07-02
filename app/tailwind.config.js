/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    fontSize: {
      xs: '2vw',
      sm: '2.5vw',
      base: '3vw',
      lg: '4vw',
      xl: '5vw',
      '2xl': '6vw',
    },
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["dark"],
  },
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        'xs': '2.5vw',
        'sm': '3vw',
        'base': '4vw',
        'lg': '4.5vw',
        'xl': '5vw',
        '2xl': '6vw',
        '3xl': '7vw',
        '4xl': '8vw',
        '5xl': '9vw',
        '6xl': '10vw',
      },
      spacing: {
        '1': '2vw',
        '2': '4vw',
        '3': '6vw',
        '4': '8vw',
        '5': '10vw',
        '6': '12vw',
        '8': '16vw',
        '10': '20vw',
        '12': '24vw',
        '16': '32vw',
        '20': '40vw',
        '24': '48vw',
      },
      minHeight: {
        'touch': '44px', // Minimum touch target size
      },
      borderRadius: {
        'lg': '2vw',
        'xl': '3vw',
      }
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#8b5cf6",
          "secondary": "#a78bfa", 
          "accent": "#c4b5fd",
          "neutral": "#1f2937",
          "base-100": "#111827",
          "base-200": "#1f2937",
          "base-300": "#374151",
          "info": "#06b6d4",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}

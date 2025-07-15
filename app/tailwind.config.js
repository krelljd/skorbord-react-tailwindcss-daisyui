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
  // Safelist dynamic classes used with player colors
  safelist: [
    // Text colors for player names
    'text-primary',
    'text-secondary', 
    'text-accent',
    'text-info',
    'text-success',
    'text-warning',
    'text-error',
    'text-neutral',
    'text-base-content', // fallback color
    // Badge colors
    'badge-primary',
    'badge-secondary',
    'badge-accent', 
    'badge-info',
    'badge-success',
    'badge-warning',
    'badge-error',
    'badge-neutral',
    // Badge style variants
    'badge-soft',
    'badge-outline',
    'badge-dash',
    'badge-ghost',
    // Ring colors for winner indicators
    'ring-primary',
    'ring-secondary',
    'ring-accent',
    'ring-info', 
    'ring-success',
    'ring-warning',
    'ring-error',
    'ring-neutral',
  ],
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ["light", "dark"], // Use DaisyUI's built-in themes
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}

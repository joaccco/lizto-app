/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          900: '#0C4A6E',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#0F172A',
          cardLight: '#F8FAFC',
          cardDark: '#1E293B',
        }
      },
    },
  },
  plugins: [],
};

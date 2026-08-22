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
        background: '#08080A',
        foreground: '#F4F3F7',
        card: '#131318',
        muted: '#191920',
        primary: '#7C5CFF',
        brand: '#8B6BFF',
        fluor: '#A8FF35',
        success: '#3DDC84',
        warning: '#F2B441',
        danger: '#FF5A5A',
        'muted-foreground': 'rgba(244, 243, 247, 0.55)',
        border: 'rgba(255, 255, 255, 0.09)',
        input: 'rgba(255, 255, 255, 0.12)',
      },
      fontFamily: {
        sans: ['Manrope_400Regular', 'sans-serif'],
        'sans-medium': ['Manrope_500Medium', 'sans-serif'],
        'sans-semibold': ['Manrope_600SemiBold', 'sans-serif'],
        'sans-bold': ['Manrope_700Bold', 'sans-serif'],
        'sans-extrabold': ['Manrope_800ExtraBold', 'sans-serif'],
        mono: ['IBMPlexMono_400Regular', 'monospace'],
        'mono-medium': ['IBMPlexMono_500Medium', 'monospace'],
        'mono-semibold': ['IBMPlexMono_600SemiBold', 'monospace'],
      },
      borderRadius: {
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};

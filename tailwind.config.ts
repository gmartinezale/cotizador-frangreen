import type { Config } from 'tailwindcss'
const {heroui} = require("@heroui/theme");

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './node_modules/@heroui/theme/dist/components/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      animation: {
        'card-flip': 'card-flip 2s ease-in-out forwards',
        'card-flip-absolute': 'card-flip-absolute 2s ease-in-out forwards',
        shine: 'shine 2s ease-in',
      }
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}

export default config

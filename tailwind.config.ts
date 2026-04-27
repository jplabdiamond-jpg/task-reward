import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Freecash-style Dark Theme tokens
        bg: {
          DEFAULT: '#0e1014',
          secondary: '#171a21',
          tertiary: '#1f2330',
          elevated: '#252a38',
        },
        border: {
          DEFAULT: '#2a2f3d',
          light: '#3a4050',
        },
        accent: {
          green: '#22c55e',
          yellow: '#f59e0b',
          blue: '#3b82f6',
          purple: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 18px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)',
        elevated: '0 8px 24px rgba(0,0,0,0.4)',
        'glow-green': '0 0 24px rgba(34, 197, 94, 0.3)',
        'glow-yellow': '0 0 24px rgba(245, 158, 11, 0.3)',
      },
      animation: {
        'count-up': 'count-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
}
export default config

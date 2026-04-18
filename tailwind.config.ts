import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Notion Design System
        'notion-blue': '#0075de',
        'notion-blue-active': '#005bab',
        'notion-blue-focus': '#097fe8',
        'notion-black': 'rgba(0,0,0,0.95)',
        'warm-white': '#f6f5f4',
        'warm-dark': '#31302e',
        'warm-gray-500': '#615d59',
        'warm-gray-300': '#a39e98',
        'badge-blue-bg': '#f2f9ff',
        'badge-blue-text': '#097fe8',
        // Semantic
        'success': '#1aae39',
        'warning': '#dd5b00',
        'teal': '#2a9d99',
        'purple': '#391c57',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
      },
      boxShadow: {
        'card': 'rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2px 7.8px, rgba(0,0,0,0.02) 0px 0.8px 2.9px, rgba(0,0,0,0.01) 0px 0.175px 1px',
        'deep': 'rgba(0,0,0,0.01) 0px 1px 3px, rgba(0,0,0,0.02) 0px 3px 7px, rgba(0,0,0,0.02) 0px 7px 15px, rgba(0,0,0,0.04) 0px 14px 28px, rgba(0,0,0,0.05) 0px 23px 52px',
      },
    },
  },
  plugins: [],
}
export default config

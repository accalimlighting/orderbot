/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        surface: {
          50: '#f8f9fc',
          100: '#f0f2f7',
          200: '#e2e5ee',
          300: '#cdd2df',
          400: '#9ca5b8',
          500: '#6b7790',
          600: '#4a5568',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        match: { light: '#ecfdf5', DEFAULT: '#10b981', dark: '#065f46' },
        warn: { light: '#fffbeb', DEFAULT: '#f59e0b', dark: '#92400e' },
        error: { light: '#fef2f2', DEFAULT: '#ef4444', dark: '#991b1b' },
        info: { light: '#eff6ff', DEFAULT: '#3b82f6', dark: '#1e40af' },
      },
    },
  },
  plugins: [],
};

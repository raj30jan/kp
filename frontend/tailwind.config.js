/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        kisan: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        // Logo-based brand palette
        brand: {
          green: {
            50: '#f0f9f0',
            100: '#dcf0dc',
            200: '#bce0bc',
            300: '#8ec98e',
            400: '#5aab5a',
            500: '#2e8b2e',
            600: '#1f7a1f',
            700: '#1a6b1a',
            800: '#145214',
            900: '#0e3d0e'
          },
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#1e5aa8',
            700: '#1a4d8f',
            800: '#1e3a8a',
            900: '#172554'
          }
        }
      }
    }
  },
  plugins: []
};

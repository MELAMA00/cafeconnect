/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#f8f4f1',
          100: '#efe6dc',
          200: '#e1cdbd',
          300: '#cfae92',
          400: '#b98b66',
          500: '#9c6a47',
          600: '#7f5338',
          700: '#65422f',
          800: '#533728',
          900: '#3b271d',
        },
        cream: '#f6efe7',
        latte: '#e7d7c9',
        mocha: '#c49a6c',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        press: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 300ms ease-out',
        press: 'press 150ms ease-out',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-rubik)', 'Rubik', 'system-ui', 'sans-serif'],
      },
      colors: {
        orange: {
          DEFAULT: '#FF7500',
          50: '#FFF3E6',
          100: '#FFE0BF',
          200: '#FFC180',
          300: '#FFA140',
          400: '#FF8200',
          500: '#FF7500',
          600: '#E66A00',
          700: '#B34F00',
          800: '#803600',
          900: '#4D1D00',
        },
      },
    },
  },
  plugins: [],
}

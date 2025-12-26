/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          400: '#32b8c6',
          500: '#208094',
          600: '#1a6875',
        }
      }
    },
  },
  plugins: [],
}

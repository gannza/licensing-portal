/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          base: '#753918',
          primary: '#f7c35f',
          secondary: '#ebcf8a',
          special: '#5366c2',
          muted: '#68686f',
        },
      },
    },
  },
  plugins: [],
};

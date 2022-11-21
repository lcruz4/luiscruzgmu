const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: colors.gray[200],
        cyanL: '#04c2c9'
      },
      borderWidth: {
        [3]: '3px'
      },
      boxShadow: {
        'innerL-tl-cyanL-br-pink-500': `inset -3px -2px 2px ${colors.pink[500]}, inset 3px 2px 2px #04c2c9`,
        'innerL-tl-pink-500-br-cyanL': `inset -3px -2px 2px #04c2c9, inset 3px 2px 2px ${colors.pink[500]}`
      }
    },
  },
  plugins: [],
  important: true,
}

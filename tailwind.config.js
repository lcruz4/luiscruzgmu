const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'tall': '500px',
      'grande': '850px',
      'venti': '1024px',
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      },
      borderWidth: {
        '3': '3px'
      },
      boxShadow: {
        'innerL-tl-cyanL-br-pink-500': `inset -3px -2px 2px ${colors.pink[500]}, inset 3px 2px 2px #04c2c9`,
        'innerL-tl-pink-500-br-cyanL': `inset -3px -2px 2px #04c2c9, inset 3px 2px 2px ${colors.pink[500]}`,
        'innerL-lr-cyanL': `inset 0px 2px ${colors.cyanL}, inset 0px -2px ${colors.cyanL}`
      },
      colors: {
        white: colors.gray[200],
        cyanL: '#04c2c9'
      },
      transitionDuration: {
        '2': '2s'
      },
      transitionTimingFunction: {
        'outL': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      },
      rotate: {
        '30': '30deg',
        '60': '60deg',
        '120': '120deg'
      },
      spacing: {
        '100': '100px',
        '200': '200px',
        '400': '400px',
        '800': '800px'
      },
      zIndex: {
        '1': 1
      }
    },
  },
  plugins: [
    ({ addVariant }) => {
      addVariant('child', '& > *');
    }
  ],
  important: true,
}

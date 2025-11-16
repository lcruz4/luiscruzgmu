const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  important: true,
  safelist: [
    'bg-book',
    'text-book',
    'bg-best',
    'text-best',
    'bg-excellent',
    'text-excellent',
    'bg-good',
    'text-good',
    'bg-inaccuracy',
    'text-inaccuracy',
    'bg-mistake',
    'text-mistake',
    'bg-blunder',
    'text-blunder',
  ],
}

import BaseTheme from '../types';

const theme: BaseTheme = {
  colors: {
    white: '#e9e9e9',
    // gray100: '#dadada',
    black: '#040404',
    highlight: '#ff9898', // red-300
    primary: '#04c2c9', // cyanL
    spicy: '#ec3e85', // pink-500
    halfSpicy: '#ea93b7', // rose-300?
    coolRanch: '#04c2c9', // cyanL
    primaryBackground: '#1b242f', // gray-800
  },
  breakpoints: {
    mobileMax: '768px',
    tabletMax: '1024px',
  },
  rems: {
    25: '0.25rem',
    50: '0.5rem',
    75: '0.75rem',
    100: '1rem',
    125: '1.25rem',
    150: '1.5rem',
    175: '1.75rem',
    200: '2rem',
    225: '2.25rem',
    250: '2.5rem',
    275: '2.75rem',
    300: '3rem',
    350: '3.5rem',
    400: '4rem',
    500: '5rem',
    1000: '100px',
    2000: '200px',
  },
  other: {
    aboutHexagonGradient: 'radial-gradient(circle at center, #D5F5F6, #CDF3F4, #D5F5F6)',
  },
};

export default theme;

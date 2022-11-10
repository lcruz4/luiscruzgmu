export interface BaseTheme {
  colors: {
    white: string;
    black: string;
    highlight: string;
    brandPrimary: string;
    brandSpicy: string;
    primaryBackground: string;
  },
  breakpoints: {
    mobileMax: string;
  },
  rems: {
    25: string;
    50: string;
    75: string;
    100: string;
    125: string;
    150: string;
    175: string;
    200: string;
    225: string;
    250: string;
    275: string;
    300: string;
    350: string;
    400: string;
    500: string;
  }
};

export default BaseTheme;
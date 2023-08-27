export enum NavItems {
  Home = 'Home',
  About = 'About',
  Projects = 'Projects',
  Contact = 'Contact',
};

export interface BaseTheme {
  colors: {
    white: string;
    black: string;
    highlight: string;
    primary: string;
    spicy: string;
    halfSpicy: string;
    coolRanch: string;
    primaryBackground: string;
  },
  breakpoints: {
    mobileMax: string;
    tabletMax: string;
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
    1000: string;
    2000: string;
  },
  other: {
    aboutHexagonGradient: string;
  }
};

export default BaseTheme;
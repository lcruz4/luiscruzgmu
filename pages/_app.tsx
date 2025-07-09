import { ThemeProvider } from '@emotion/react';
import { Global, css } from '@emotion/react';
import theme from '../themes';

import '../styles/globals.css';
import Script from 'next/script';

const globalStyles = css`
  body {
    font-family: 'Raleway';
    font-size: 16px;
    margin: 0;
    background-color: ${theme.colors.black};
    color: ${theme.colors.white};
    overflow-x: hidden;
  }
  h1 {
    font-size: ${theme.rems[250]};
  }
`;

export const App = ({
  Component,
  pageProps,
}: {
  Component: any;
  pageProps: any;
}) => {
  return (
    <ThemeProvider theme={theme}>
      <Script src="/lib/DragDropTouch.js" />
      <Global styles={globalStyles} />
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default App;

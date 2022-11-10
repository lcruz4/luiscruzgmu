import { ThemeProvider } from '@emotion/react';
import { Global, css } from '@emotion/react'
import theme from '../themes';

const globalStyles = css`
body {
  font-family: 'Raleway';
  margin: 0;
  background-color: ${theme.colors.black};
  color: ${theme.colors.white};
}
`;

export const App = ({ Component, pageProps }) => {
  return (
    <ThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default App;

import { ThemeProvider } from '@emotion/react';
import { Global, css } from '@emotion/react';
import theme from '../themes';

import '../styles/globals.css';
import Script from 'next/script';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Script src='/lib/DragDropTouch.js' />
        <Global styles={globalStyles} />
        <Component {...pageProps} />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;

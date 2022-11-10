import '@emotion/react';
import MyTheme from '.';

declare module '@emotion/react' {
  export interface Theme extends MyTheme {}
};

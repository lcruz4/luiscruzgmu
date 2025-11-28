import 'chess.js';

declare module 'chess.js' {
  interface Chess {
    moveIndex(): number;
  }
}

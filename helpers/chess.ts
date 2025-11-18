import { Chess, Move } from 'chess.js';
import { AnalyzedMove, MoveClassification } from '../types/chess';
import { MutableRefObject } from 'react';

export const getClassificationColor = (
  classification: MoveClassification | undefined,
  type: 'bg' | 'text' = 'text',
) => {
  switch (classification) {
    case MoveClassification.BOOK:
      return `${type}-book`;
    case MoveClassification.BEST:
    case MoveClassification.EXCELLENT:
      return `${type}-best`;
    case MoveClassification.GOOD:
      return `${type}-good`;
    case MoveClassification.INACCURACY:
      return `${type}-inaccuracy`;
    case MoveClassification.MISTAKE:
      return `${type}-mistake`;
    case MoveClassification.BLUNDER:
      return `${type}-blunder`;
    default:
      return `${type}-yellow-300`;
  }
};

/**
 * This function finds the last move in history that matches the current state
 * of the chess game. It undoes moves in the chess game until it finds a match
 * or exhausts the history. if history is exhausted, index will be -1.
 * @param chess Chess
 * @param history AnalyzedMove[]
 * @param lastMoveRef MutableRefObject<Move | undefined>
 * @returns { dirtyHistory: boolean; index: number }
 * dirtyHistory indicates if the history has diverged from the chess state.
 * index is the index of the last matching move in history.
 */
export const findLastMatchingMoveIndex = (
  chess: Chess,
  history: AnalyzedMove[],
  lastMoveRef: MutableRefObject<Move | undefined>,
) => {
  let dirtyHistory = false;
  let i = chess.moveIndex();
  let move = chess.undo();
  let curHistory = history.at(i);
  while (i >= 0 && move) {
    if (curHistory?.san === move.san && curHistory?.color === move.color) {
      move = chess.move(move.san);
      break;
    }
    i--;
    move = chess.undo();
    curHistory = history.at(i);
    dirtyHistory = true;
  }
  lastMoveRef.current = move || undefined;

  return { dirtyHistory, index: i };
};

import { MutableRefObject, useCallback, useRef } from 'react';
import { Chess, Move } from 'chess.js';
import { AnalyzedMove, ChessComGameReponse } from '../../types/chess';
import { PlayerBanner } from './PlayerBanner';
import { Square } from './Square';

let i = 0;
interface BoardProps {
  chess: Chess;
  history: AnalyzedMove[];
  lastMoveRef: MutableRefObject<Move | undefined>;
  pieces: ReturnType<Chess['board']>;
  handleChessMove: (from: string, to: string) => Move | null;
  selectedGame?: ChessComGameReponse;
}

export const Board = ({
  chess,
  history,
  lastMoveRef,
  pieces,
  handleChessMove,
  selectedGame,
}: BoardProps) => {
  const dragNodeRef = useRef<HTMLImageElement>();
  const dragLocationRef = useRef<{
    x: number;
    y: number;
    top: number;
    left: number;
  }>();

  return (
    <div className='Board.tsx flex relative items-center justify-center my-12 ml-12 mr-6 min-h-0 min-w-0 flex-shrink-0'>
      <PlayerBanner isWhite={true} selectedGame={selectedGame} />
      <PlayerBanner isWhite={false} selectedGame={selectedGame} />
      <img
        src='/images/board.png'
        alt='Chess Board'
        className='block max-h-full max-w-full object-contain aspect-square'
      />
      {pieces.flat().map((piece, index) => {
        return (
          <Square
            key={index}
            chess={chess}
            dragNodeRef={dragNodeRef}
            dragLocationRef={dragLocationRef}
            piece={piece}
            index={index}
            history={history}
            lastMoveRef={lastMoveRef}
            handleChessMove={handleChessMove}
          />
        );
      })}
    </div>
  );
};

export default Board;

import { Chess, Move, WHITE } from 'chess.js';
import { useCallback, useRef, useState } from 'react';
import { AnalyzedMove, ChessComGameReponse } from '../../types/chess';
import { Board } from '../../components/chessReview/Board';
import { Sidebar } from '../../components/chessReview/Sidebar';

const chess = new Chess();
Chess.prototype.moveIndex = () => (chess.moveNumber() - 1) * 2 - (chess.turn() === WHITE ? 1 : 0);

export const ChessReview = () => {
  const [pieces, setPieces] = useState(chess.board());
  const [selectedGame, setSelectedGame] = useState<ChessComGameReponse>();
  const [history, setHistory] = useState<AnalyzedMove[]>([]);
  const lastMoveRef = useRef<Move>();

  const handleChessMove = useCallback((from: string, to: string) => {
    try {
      lastMoveRef.current = chess.move({ from, to });
      setPieces(chess.board());
      return lastMoveRef.current;
    } catch (error) {
      return null;
    }
  }, []);

  return (
    <div
      className='chess-review.tsx h-screen w-full flex flex-col font-[Chess_Sans]'
      onDragOver={(event) => {
        event.preventDefault();
      }}
    >
      <h1 className='text-center py-4'>Chess Reviewer</h1>
      <div className='flex flex-1 min-h-0'>
        <Board
          chess={chess}
          history={history}
          lastMoveRef={lastMoveRef}
          pieces={pieces}
          handleChessMove={handleChessMove}
          selectedGame={selectedGame}
        />

        <Sidebar
          chess={chess}
          selectedGame={selectedGame}
          setSelectedGame={setSelectedGame}
          history={history}
          setHistory={setHistory}
          lastMoveRef={lastMoveRef}
          setPieces={setPieces}
        />
      </div>
    </div>
  );
};

export default ChessReview;

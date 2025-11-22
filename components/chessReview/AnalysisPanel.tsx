import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { Chess, Move } from 'chess.js';
import { AnalyzedMove, ChessComGameReponse } from '../../types/chess';
import { MoveHistory } from './MoveHistory';
import { Controls } from './Controls';

interface AnalysisPanelProps {
  chess: Chess;
  fetchedGames: ChessComGameReponse[];
  history: AnalyzedMove[];
  setHistory: Dispatch<SetStateAction<AnalyzedMove[]>>;
  lastMoveRef: MutableRefObject<Move | undefined>;
  setPieces: Dispatch<SetStateAction<ReturnType<Chess['board']>>>;
  selectedGame?: ChessComGameReponse;
}

export const AnalysisPanel = ({
  chess,
  fetchedGames,
  history,
  setHistory,
  lastMoveRef,
  setPieces,
  selectedGame,
}: AnalysisPanelProps) => {
  return (
    <div className='AnalysisPanel.tsx flex flex-col min-h-0 flex-1'>
      <h2 className='text-xl font-semibold mb-4'>Chess Analysis</h2>
      <MoveHistory
        chess={chess}
        fetchedGames={fetchedGames}
        history={history}
        lastMoveRef={lastMoveRef}
        setHistory={setHistory}
        setPieces={setPieces}
        selectedGame={selectedGame}
      />
      <Controls
        chess={chess}
        history={history}
        lastMoveRef={lastMoveRef}
        setPieces={setPieces}
      />
    </div>
  );
};

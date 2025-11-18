import { Dispatch, MutableRefObject, SetStateAction, useState } from 'react';
import { Chess, Move } from 'chess.js';
import { AnalyzedMove, ChessComGameReponse } from '../../types/chess';
import { Tabs } from './Tabs';
import { GamesPanel } from './GamesPanel';
import { AnalysisPanel } from './AnalysisPanel';

interface SidebarProps {
  chess: Chess;
  selectedGame?: ChessComGameReponse;
  setSelectedGame: Dispatch<SetStateAction<ChessComGameReponse | undefined>>;
  history: AnalyzedMove[];
  setHistory: Dispatch<SetStateAction<AnalyzedMove[]>>;
  lastMoveRef: MutableRefObject<Move | undefined>;
  setPieces: Dispatch<SetStateAction<ReturnType<Chess['board']>>>;
}

export const Sidebar = ({
  chess,
  selectedGame,
  setSelectedGame,
  history,
  setHistory,
  lastMoveRef,
  setPieces,
}: SidebarProps) => {
  const [activeTab, setActiveTab] = useState<'games' | 'analysis'>('games');
  const [fetchedGames, setFetchedGames] = useState<ChessComGameReponse[]>([]);

  return (
    <div className='flex-1 bg-gray-800 p-4 flex flex-col min-h-0'>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'games' && (
        <GamesPanel
          fetchedGames={fetchedGames}
          setFetchedGames={setFetchedGames}
          setSelectedGame={setSelectedGame}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'analysis' && (
        <AnalysisPanel
          chess={chess}
          fetchedGames={fetchedGames}
          history={history}
          setHistory={setHistory}
          lastMoveRef={lastMoveRef}
          setPieces={setPieces}
          selectedGame={selectedGame}
        />
      )}
    </div>
  );
};

import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { BLACK, Chess, Color, Move, WHITE } from 'chess.js';
import {
  findLastMatchingMoveIndex,
  getClassificationColor,
} from '../../helpers/chess';
import { Classification } from './Classification';
import {
  Analysis,
  AnalyzedMove,
  ChessComGameReponse,
  FullMoveHistory,
} from '../../types/chess';
import { MoveHistoryPair } from './MoveHistoryPair';
import { Line } from './Line';

interface MoveHistoryProps {
  chess: Chess;
  fetchedGames: ChessComGameReponse[];
  history: AnalyzedMove[];
  lastMoveRef: MutableRefObject<Move | undefined>;
  setHistory: Dispatch<SetStateAction<AnalyzedMove[]>>;
  setPieces: Dispatch<SetStateAction<ReturnType<Chess['board']>>>;
  selectedGame?: ChessComGameReponse;
}

export const MoveHistory = ({
  chess,
  fetchedGames,
  history,
  lastMoveRef,
  setHistory,
  setPieces,
  selectedGame,
}: MoveHistoryProps) => {
  const [fullMoveHistory, setFullMoveHistory] = useState<FullMoveHistory[]>([]);
  const isWhiteNext = chess.turn() === WHITE;
  const moveNumber = chess.moveNumber() - (isWhiteNext ? 1 : 0);
  const lines =
    history[moveNumber - 1 - (isWhiteNext ? 1 : 0)]?.analysis?.eval
      .lines || [];

  let analysisQuery = useQuery<{ success: boolean; analysis: Analysis[] }>({
    queryKey: ['chess-review', selectedGame?.pgn],
    queryFn: async () => {
      if (!selectedGame) throw new Error('No game selected');
      const response = await fetch(
        `/api/chess-review?pgn=${encodeURIComponent(selectedGame.pgn)}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      return response.json();
    },
    enabled: !!selectedGame,
  });

  const firstGameAnalysis = useQuery<{
    success: boolean;
    analysis: Analysis[];
  }>({
    queryKey: ['chess-review', fetchedGames[0]?.pgn],
    queryFn: async () => {
      if (fetchedGames.length === 0) throw new Error('No game fetched');
      const response = await fetch(
        `/api/chess-review?pgn=${encodeURIComponent(fetchedGames[0].pgn)}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch analysis for first game');
      }
      return response.json();
    },
    enabled: fetchedGames.length > 0,
  });

  if (!analysisQuery.isEnabled) {
    analysisQuery = firstGameAnalysis;
  }

  useEffect(() => {
    if (selectedGame) {
      chess.loadPgn(selectedGame.pgn);
      const chessHistory = chess.history({ verbose: true });
      setHistory(chessHistory);
      const _history = chessHistory.reduce<FullMoveHistory[]>(
        (acc, move, index) => {
          if (index % 2 === 0) {
            const moveNumber = Math.ceil((index + 1) / 2);
            const blackMove = chessHistory.at(index + 1);

            acc.push({ moveNumber, whiteMove: move, blackMove });
          }
          return acc;
        },
        [],
      );
      setFullMoveHistory(_history);
      chess.reset();
      setPieces(chess.board());
    }
  }, [selectedGame]);

  useEffect(() => {
    if (analysisQuery.data?.success && !history.at(0)?.analysis) {
      const analyzedHistory = history.map((move, index) => {
        const analyzedMove = move as AnalyzedMove;
        analyzedMove.analysis = analysisQuery.data?.analysis[index];
        return analyzedMove;
      });
      setHistory(analyzedHistory);
    }
  }, [analysisQuery.data, history]);

  const handleHistoryItemClick = (
    historyItem: FullMoveHistory,
    color: Color,
  ) => {
    const historyIndex =
      (historyItem.moveNumber - 1) * 2 + (color === WHITE ? 0 : 1);
    const historySoFar = history.slice(0, historyIndex + 1);
    const { index } = findLastMatchingMoveIndex(
      chess,
      historySoFar,
      lastMoveRef,
    );

    for (const move of history.slice(index + 1, historyIndex + 1)) {
      lastMoveRef.current = chess.move(move.san);
    }

    setPieces(chess.board());
  };

  return (
    <div className='MoveHistory.tsx flex-1 overflow-y-auto min-h-0 font-sans'>
      {lines.map((line, idx) => (
        <Line
          key={idx}
          line={line}
          moveNumber={moveNumber}
          isWhiteNext={isWhiteNext}
        />
      ))}
      {selectedGame ? (
        <div>
          {fullMoveHistory.map((historyItem) => (
            <MoveHistoryPair
              key={JSON.stringify(historyItem)}
              historyItem={historyItem}
              history={history}
              isWhiteNext={isWhiteNext}
              fullMoveNumber={moveNumber}
              lastMoveRef={lastMoveRef}
              handleHistoryItemClick={handleHistoryItemClick}
            />
          ))}
        </div>
      ) : (
        <p className='text-gray-300'>
          No game selected. Please select a game from the "Games" tab to view
          its analysis.
        </p>
      )}
    </div>
  );
};

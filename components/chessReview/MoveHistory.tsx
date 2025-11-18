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
import { Analysis, AnalyzedMove, ChessComGameReponse } from '../../types/chess';

interface MoveHistoryProps {
  chess: Chess;
  fetchedGames: ChessComGameReponse[];
  history: AnalyzedMove[];
  lastMoveRef: MutableRefObject<Move | undefined>;
  setHistory: Dispatch<SetStateAction<AnalyzedMove[]>>;
  setPieces: Dispatch<SetStateAction<ReturnType<Chess['board']>>>;
  selectedGame?: ChessComGameReponse;
}

interface FullMoveHistory {
  moveNumber: number;
  whiteMove: AnalyzedMove;
  blackMove?: AnalyzedMove;
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
  const moveRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

      const _history = history.reduce<FullMoveHistory[]>((acc, move, index) => {
        if (index % 2 === 0) {
          const moveNumber = Math.ceil((index + 1) / 2);
          const blackMove = history.at(index + 1);
          acc.push({ moveNumber, whiteMove: move, blackMove });
        }
        return acc;
      }, []);
      setFullMoveHistory(_history);
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
    <div className='flex-1 overflow-y-auto min-h-0 font-sans'>
      {selectedGame ? (
        <div>
          {fullMoveHistory.map((historyItem) => {
            const isWhiteTurn = chess.turn() === WHITE;
            const moveNumber = chess.moveNumber() - (isWhiteTurn ? 1 : 0);
            const curMove = lastMoveRef.current;
            const whiteClassification =
              historyItem.whiteMove.analysis?.classificationLichessFormula;
            const blackClassification =
              historyItem.blackMove?.analysis?.classificationLichessFormula;
            const hightlightWhiteMove =
              !isWhiteTurn &&
              moveNumber === historyItem.moveNumber &&
              curMove?.san === historyItem.whiteMove.san
                ? getClassificationColor(whiteClassification)
                : '';
            const highlightBlackMove =
              isWhiteTurn &&
              moveNumber === historyItem.moveNumber &&
              curMove?.san === historyItem.blackMove?.san
                ? getClassificationColor(blackClassification)
                : '';

            moveRefs.current[`move-${moveNumber || 1}`]?.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });

            return (
              <div
                key={JSON.stringify(historyItem)}
                className='text-gray-300 mb-1'
                ref={(el) => {
                  moveRefs.current[`move-${historyItem.moveNumber}`] = el;
                }}
              >
                {historyItem.moveNumber}
                {')'}
                <span
                  className={`hover:underline cursor-pointer ml-2 font-bold ${hightlightWhiteMove}`}
                  onClick={() => handleHistoryItemClick(historyItem, WHITE)}
                >
                  {historyItem.whiteMove.san}{' '}
                  {whiteClassification && (
                    <div className='max-h-4 max-w-4 inline-block'>
                      <Classification classification={whiteClassification} />
                    </div>
                  )}
                </span>{' '}
                {historyItem.blackMove && (
                  <span
                    className={`hover:underline cursor-pointer ml-2 font-bold ${highlightBlackMove}`}
                    onClick={() => handleHistoryItemClick(historyItem, BLACK)}
                  >
                    {historyItem.blackMove.san}{' '}
                    {blackClassification && (
                      <div className='max-h-4 max-w-4 inline-block'>
                        <Classification classification={blackClassification} />
                      </div>
                    )}
                  </span>
                )}
              </div>
            );
          })}
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

import { MutableRefObject, useEffect, useRef } from 'react';
import { BLACK, Color, Move, WHITE } from 'chess.js';
import { Classification } from './Classification';
import { getClassificationColor } from '../../helpers/chess';
import { AnalyzedMove, FullMoveHistory } from '../../types/chess';

interface MoveHistoryPairProps {
  historyItem: FullMoveHistory;
  history: AnalyzedMove[];
  isWhiteNext: boolean;
  fullMoveNumber: number;
  lastMoveRef: MutableRefObject<Move | undefined>;
  handleHistoryItemClick: (
    historyItem: FullMoveHistory,
    color: Color,
  ) => void;
}

export const MoveHistoryPair = ({
  historyItem,
  history,
  isWhiteNext,
  fullMoveNumber,
  lastMoveRef,
  handleHistoryItemClick,
}: MoveHistoryPairProps) => {
  const moveRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const halfMoveIndex = (historyItem.moveNumber - 1) * 2;
  const whiteClassification =
    history[halfMoveIndex]?.analysis?.classificationLichessFormula;
  const blackClassification =
    history[halfMoveIndex + 1]?.analysis?.classificationLichessFormula;
  const hightlightWhiteMove =
    !isWhiteNext &&
    fullMoveNumber === historyItem.moveNumber &&
    lastMoveRef.current?.san === historyItem.whiteMove.san
      ? getClassificationColor(whiteClassification)
      : '';
  const highlightBlackMove =
    isWhiteNext &&
    fullMoveNumber === historyItem.moveNumber &&
    lastMoveRef.current?.san === historyItem.blackMove?.san
      ? getClassificationColor(blackClassification)
      : '';

  useEffect(() => {
    moveRefs.current[`move-${fullMoveNumber || 1}`]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [fullMoveNumber]);

  return (
    <div
      className='MoveHistoryPair.tsx text-gray-300 mb-1'
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
};

export default MoveHistoryPair;

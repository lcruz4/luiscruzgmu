import { DragEvent, MutableRefObject, useCallback } from 'react';
import { Chess, Move, Piece } from 'chess.js';
import { Classification } from './Classification';
import { AnalyzedMove } from '../../types/chess';
import { getClassificationColor } from '../../helpers/chess';
import { Arrow } from './Arrow';

interface SquareProps {
  chess: Chess;
  dragNodeRef: MutableRefObject<HTMLImageElement | undefined>;
  dragLocationRef: MutableRefObject<
    | {
        x: number;
        y: number;
        top: number;
        left: number;
      }
    | undefined
  >;
  handleChessMove: (from: string, to: string) => Move | null;
  history: AnalyzedMove[];
  index: number;
  lastMoveRef: MutableRefObject<Move | undefined>;
  piece: Piece | null;
}

export const Square = ({
  chess,
  dragNodeRef,
  dragLocationRef,
  handleChessMove,
  history,
  index,
  lastMoveRef,
  piece,
}: SquareProps) => {
  const handleDragStart = useCallback(
    (event: DragEvent<HTMLImageElement>, square: string) => {
      event.dataTransfer.clearData();
      event.dataTransfer.setData('text/plain', square);
      event.dataTransfer.effectAllowed = 'move';
      document.body.style.cursor = 'grabbing';

      dragLocationRef.current = {
        x: event.clientX,
        y: event.clientY,
        top: event.currentTarget.offsetTop,
        left: event.currentTarget.offsetLeft,
      };
    },
    [],
  );

  const handleDrag = useCallback((event: DragEvent<HTMLImageElement>) => {
    if (!dragLocationRef.current) return;
    if (!dragNodeRef.current) {
      const originalElement = event.currentTarget as HTMLImageElement;
      const clone = originalElement.cloneNode() as HTMLImageElement;
      originalElement.parentElement?.appendChild(clone);
      originalElement.style.visibility = 'hidden';
      clone.id = `${clone.id}_clone`;
      clone.style.pointerEvents = 'none';
      dragNodeRef.current = clone;
    }

    const startingX = dragLocationRef.current.x ?? 0;
    const startingY = dragLocationRef.current.y ?? 0;
    const deltaX = event.clientX - startingX;
    const deltaY = event.clientY - startingY;
    const newTop = (dragLocationRef.current.top ?? 0) + deltaY;
    const newLeft = (dragLocationRef.current.left ?? 0) + deltaX;

    dragNodeRef.current.style.top = `${newTop}px`;
    dragNodeRef.current.style.left = `${newLeft}px`;
  }, []);

  const handleDragEnd = useCallback((event: DragEvent<HTMLImageElement>) => {
    if (!dragLocationRef.current || !dragNodeRef.current) return;
    const originalElement = event.currentTarget as HTMLImageElement;
    dragNodeRef.current.classList.add(
      'transition-all',
      'duration-300',
      'ease-out',
    );
    dragNodeRef.current.ontransitionend = () => {
      dragNodeRef.current?.remove();
      dragNodeRef.current = undefined;
      originalElement.style.visibility = 'visible';
    };
    dragNodeRef.current.style.top = `${dragLocationRef.current.top}px`;
    dragNodeRef.current.style.left = `${dragLocationRef.current.left}px`;
    dragLocationRef.current = undefined;
    document.body.style.cursor = '';
  }, []);

  const handleDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.add('border-2', 'border-blue-400');
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove('border-2', 'border-blue-400');
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, square: string) => {
      const originalLocation = event.dataTransfer.getData('text/plain');
      event.currentTarget.classList.remove('border-2', 'border-blue-400');
      const move = handleChessMove(originalLocation, square);
      if (dragNodeRef.current && move) {
        dragNodeRef.current.remove();
        dragNodeRef.current = undefined;
      }
      document.body.style.cursor = '';
    },
    [handleChessMove],
  );

  const left = (index % 8) * 12.5;
  const top = Math.floor(index / 8) * 12.5;
  const rank = 8 - Math.floor(index / 8);
  const file = String.fromCharCode('a'.charCodeAt(0) + (index % 8));
  const annotationTop =
    Math.floor(index / 8) * 12.5 - 6.25 * (rank === 8 ? -1 : 1);
  const annotationLeft = (index % 8) * 12.5 + 6.25 * (file === 'h' ? -1 : 1);
  const square = `${file}${rank}`;
  const imageName = piece ? `${piece.color}${piece.type}` : '';
  const lastMove = lastMoveRef.current;
  const moveIndex = chess.moveIndex();
  const isHighlightSquare =
    lastMove?.from === square || lastMove?.to === square;
  const { classificationLichessFormula: classification, bestMove } = history[moveIndex]?.analysis || {};
  const highlightColor = isHighlightSquare
    ? getClassificationColor(classification, 'bg')
    : '';
  const from = bestMove?.slice(0, 2);
  const to = bestMove?.slice(2, 4);

  return (
    <div className='Square.tsx'>
      {piece ? (
        <img
          id={`${square}_${imageName}`}
          className={`absolute h-[12.5%] w-[12.5%] cursor-grab pointer-events-auto z-1`}
          style={{
            top: `${top}%`,
            left: `${left}%`,
          }}
          draggable
          onDragStart={(event) => handleDragStart(event, square)}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(event) => handleDrop(event, square)}
          src={`/images/${imageName}.png`}
          alt={imageName}
        />
      ) : null}
      <div
        id={square}
        className={`absolute h-[12.5%] w-[12.5%] opacity-50 ${highlightColor}`}
        style={{
          top: `${top}%`,
          left: `${left}%`,
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={(event) => handleDrop(event, square)}
      />
      {classification && lastMove?.to === square && (
        <div
          id={`${square}_annotation`}
          className={`absolute h-[12.5%] w-[12.5%] z-2 justify-center items-center flex`}
          style={{
            top: `${annotationTop}%`,
            left: `${annotationLeft}%`,
          }}
        >
          <div className='h-[40%] w-[40%]'>
            <Classification classification={classification} />
          </div>
        </div>
      )}
      {from === square && to && (
        <Arrow from={from} to={to} top={top} left={left} />
      )}
    </div>
  );
};

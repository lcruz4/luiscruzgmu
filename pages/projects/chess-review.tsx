import { Chess } from 'chess.js';
import { DragEvent, useRef, useState } from 'react';
const chess = new Chess();

export const ChessReview = () => {
  const [pieces, setPieces] = useState(chess.board());
  const dragLocationRef = useRef<{
    x: number;
    y: number;
    top: number;
    left: number;
  } | null>(null);
  const dragNodeRef = useRef<HTMLImageElement | null>(null);
  const history = chess.history({ verbose: true });
  const formattedHistory = history.reduce<string[]>((acc, move, index) => {
    if (index % 2 === 0) {
      const moveNumber = Math.ceil((index + 1) / 2);
      const whiteMove = move.san;
      const blackMove = history[index + 1]?.san ?? '';
      acc.push(`${moveNumber}. ${whiteMove} ${blackMove}`);
    }
    return acc;
  }, []);

  const handleChessMove = (from: string, to: string) => {
    try {
      const move = chess.move({ from, to });
      setPieces(chess.board());
      return move;
    } catch (error) {
      return null;
    }
  };

  const handleDragStart = (
    event: DragEvent<HTMLImageElement>,
    square: string,
  ) => {
    event.dataTransfer.clearData();
    event.dataTransfer.setData('text/plain', square);
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.style.cursor = 'grabbing';

    dragLocationRef.current = {
      x: event.clientX,
      y: event.clientY,
      top: event.currentTarget.offsetTop,
      left: event.currentTarget.offsetLeft,
    };
  };

  const handleDrag = (
    event: DragEvent<HTMLImageElement>,
    square: string,
    imageName: string,
  ) => {
    if (!dragLocationRef.current) return;
    if (!dragNodeRef.current) {
      const originalElement = event.currentTarget as HTMLImageElement;
      const clone = originalElement.cloneNode() as HTMLImageElement;
      originalElement.parentElement?.appendChild(clone);
      originalElement.style.visibility = 'hidden';
      clone.classList.add(`clone-of-${imageName}-on-${square}`);
      clone.style.cursor = 'grabbing';
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
  };

  const handleDragEnd = (event: DragEvent<HTMLImageElement>) => {
    if (!dragLocationRef.current || !dragNodeRef.current) return;
    const originalElement = event.currentTarget as HTMLImageElement;
    dragNodeRef.current.classList.add(
      'transition-all',
      'duration-300',
      'ease-out',
    );
    dragNodeRef.current.ontransitionend = () => {
      dragNodeRef.current?.remove();
      dragNodeRef.current = null;
      originalElement.style.visibility = 'visible';
    };
    dragNodeRef.current.style.top = `${dragLocationRef.current.top}px`;
    dragNodeRef.current.style.left = `${dragLocationRef.current.left}px`;
    dragLocationRef.current = null;
    originalElement.style.cursor = 'grab';
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.add('border-2', 'border-blue-400');
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove('border-2', 'border-blue-400');
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    square: string,
  ) => {
    const originalLocation = event.dataTransfer.getData('text/plain');
    event.currentTarget.classList.remove('border-2', 'border-blue-400');
    const move = handleChessMove(originalLocation, square);
    if (dragNodeRef.current && move) {
      dragNodeRef.current.remove();
      dragNodeRef.current = null;
    }
  };

  return (
    <div
      className='h-screen w-full flex flex-col font-[Chess_Sans] font-sans'
      onDragOver={(event) => {
        event.preventDefault();
      }}
    >
      <h1 className='text-center py-8'>Chess Reviewer</h1>
      <div className='flex flex-1 min-h-0'>
        {/* Chess board */}
        <div className='flex relative items-center justify-center mb-12 ml-12 mr-6 min-h-0 min-w-0 flex-shrink-0'>
          <img
            src='/images/board.png'
            alt='Chess Board'
            className='block max-h-full max-w-full object-contain aspect-square'
          />
          {pieces.flat().map((piece, index) => {
            const left = (index % 8) * 12.5;
            const top = Math.floor(index / 8) * 12.5;
            const rank = 8 - Math.floor(index / 8);
            const file = String.fromCharCode('a'.charCodeAt(0) + (index % 8));
            const square = `${file}${rank}`;
            const imageName = piece ? `${piece.color}${piece.type}` : '';

            return piece ? (
              <img
                key={square}
                className='absolute h-[12.5%] w-[12.5%] cursor-grab pointer-events-auto'
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                }}
                draggable
                onDragStart={(event) => handleDragStart(event, square)}
                onDrag={(event) => handleDrag(event, square, imageName)}
                onDragEnd={handleDragEnd}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={(event) => handleDrop(event, square)}
                src={`/images/${imageName}.png`}
                alt={imageName}
              />
            ) : (
              <div
                key={square}
                className='absolute h-[12.5%] w-[12.5%]'
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={(event) => handleDrop(event, square)}
              />
            );
          })}
        </div>

        {/* Analysis */}
        <div className='flex-1 bg-gray-800 p-4'>
          <h2 className='text-xl font-semibold mb-4'>Chess Analysis</h2>
          <p>Your chess analysis content goes here...</p>
          {formattedHistory.map((move, index) => (
            <div key={index}>{move}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessReview;

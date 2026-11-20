import { type DragEvent, useState } from 'react';
import { canBeHealed } from '@/lib/remorse/engine';
import { cn } from '@/lib/utils';
import type { GameState, Piece } from '@/types/remorse';
import { Marker } from './Marker';
import { traumaLabel } from './markerSvg';

const FILES = 'abcdefgh';

const squaresFor = (flipped: boolean) => {
  const squares: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    for (const file of FILES) squares.push(`${file}${rank}`);
  }
  return flipped ? squares.reverse() : squares;
};

interface BoardProps {
  state: GameState;
  flipped: boolean;
  // the viewer may move the side whose turn it is
  canMove: boolean;
  lastMove: { from: string; to: string } | null;
  onMove: (from: string, to: string) => void;
  // a friendly bishop's own marker: it can spend the turn healing itself
  onSelfHeal: (piece: Piece) => void;
}

export const Board = ({
  state,
  flipped,
  canMove,
  lastMove,
  onMove,
  onSelfHeal,
}: BoardProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const bySquare = new Map(state.pieces.map((piece) => [piece.square, piece]));
  const isMine = (piece?: Piece) => canMove && piece?.color === state.turn;

  const handleClick = (square: string) => {
    const piece = bySquare.get(square);
    if (isMine(piece)) {
      setSelected(selected === square ? null : square);
      return;
    }
    if (selected) {
      onMove(selected, square);
      setSelected(null);
    }
  };

  const handleDrop = (event: DragEvent, square: string) => {
    event.preventDefault();
    const from = event.dataTransfer.getData('text/plain');
    setSelected(null);
    if (from && from !== square) onMove(from, square);
  };

  return (
    <div className='relative aspect-square w-full max-w-[min(640px,calc(100dvh-140px))] select-none'>
      <img
        src='/images/board.png'
        alt=''
        className='absolute inset-0 h-full w-full rounded-sm'
      />
      <div className='absolute inset-0 grid grid-cols-8 grid-rows-8'>
        {squaresFor(flipped).map((square, index) => {
          const piece = bySquare.get(square);
          const selfHeal =
            piece && isMine(piece) && piece.type === 'b' && canBeHealed(piece);
          const rankLabel = index % 8 === 0;
          const fileLabel = index >= 56;
          return (
            <div
              key={square}
              className={cn(
                'relative',
                (lastMove?.from === square || lastMove?.to === square) &&
                  'bg-yellow-300/40',
                selected === square && 'bg-sky-400/50',
              )}
              onClick={() => handleClick(square)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, square)}
            >
              {rankLabel && (
                <span className='pointer-events-none absolute left-[3%] top-[2%] text-[10px] font-semibold text-black/45'>
                  {square[1]}
                </span>
              )}
              {fileLabel && (
                <span className='pointer-events-none absolute bottom-[1%] right-[4%] text-[10px] font-semibold text-black/45'>
                  {square[0]}
                </span>
              )}
              {piece && (
                <img
                  src={`/images/${piece.color}${piece.type}.png`}
                  alt={`${piece.color}${piece.type}`}
                  draggable={isMine(piece)}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', square);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  className={cn(
                    'h-full w-full',
                    isMine(piece) && 'cursor-grab',
                  )}
                />
              )}
              {piece?.trauma && (
                <button
                  type='button'
                  title={`${traumaLabel({ ...piece, trauma: piece.trauma })}${
                    selfHeal ? '. Click to heal itself (uses your turn)' : ''
                  }`}
                  aria-label={traumaLabel({ ...piece, trauma: piece.trauma })}
                  disabled={!selfHeal}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelfHeal(piece);
                  }}
                  className={cn(
                    'absolute -right-[10%] -top-[10%] z-10 h-[52%] w-[52%] drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]',
                    selfHeal
                      ? 'cursor-pointer rounded-full ring-2 ring-emerald-300 ring-offset-0 animate-pulse'
                      : 'pointer-events-none',
                  )}
                >
                  <Marker
                    className='block h-full w-full'
                    trauma={piece.trauma}
                    healed={piece.healed}
                    turnsLeft={piece.turnsLeft}
                    kills={piece.kills}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

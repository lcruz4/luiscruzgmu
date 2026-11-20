import { type PointerEvent, useRef, useState } from 'react';
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
  // During a psychopath's extra move only that piece may move
  const isMine = (piece?: Piece) =>
    canMove &&
    piece?.color === state.turn &&
    (!state.extraMovePieceId || piece.id === state.extraMovePieceId);

  const handleClick = (square: string) => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
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

  // Pointer-based drag so it works with touch as well as a mouse. A press
  // that barely moves stays a tap and falls through to handleClick.
  const boardRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ from: string; x: number; y: number } | null>(null);
  const justDragged = useRef(false);
  const [drag, setDrag] = useState<{
    from: string;
    dx: number;
    dy: number;
  } | null>(null);
  const squares = squaresFor(flipped);

  const squareAt = (x: number, y: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const col = Math.floor(((x - rect.left) / rect.width) * 8);
    const row = Math.floor(((y - rect.top) / rect.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return squares[row * 8 + col];
  };

  const handlePointerDown = (event: PointerEvent, square: string) => {
    if (!isMine(bySquare.get(square))) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    press.current = { from: square, x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: PointerEvent) => {
    const start = press.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (drag || Math.hypot(dx, dy) > 6) setDrag({ from: start.from, dx, dy });
  };

  const handlePointerUp = (event: PointerEvent) => {
    const start = press.current;
    press.current = null;
    if (!start || !drag) return;
    setDrag(null);
    setSelected(null);
    justDragged.current = true;
    const to = squareAt(event.clientX, event.clientY);
    if (to && to !== start.from) onMove(start.from, to);
  };

  return (
    <div
      ref={boardRef}
      className='relative aspect-square w-full max-w-[min(640px,calc(100dvh-140px))] select-none'
    >
      <img
        src='/images/board.png'
        alt=''
        className='absolute inset-0 h-full w-full rounded-sm'
      />
      <div className='absolute inset-0 grid grid-cols-8 grid-rows-8'>
        {squares.map((square, index) => {
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
                <div
                  className={cn(
                    'relative h-full w-full',
                    isMine(piece) && 'cursor-grab touch-none',
                    drag?.from === square && 'z-30 cursor-grabbing',
                  )}
                  style={
                    drag?.from === square
                      ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` }
                      : undefined
                  }
                  onPointerDown={(event) => handlePointerDown(event, square)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={() => {
                    press.current = null;
                    setDrag(null);
                  }}
                >
                  <img
                    src={`/images/${piece.color}${piece.type}.png`}
                    alt={`${piece.color}${piece.type}`}
                    draggable={false}
                    className='pointer-events-none h-full w-full'
                  />
                  {piece.trauma && (
                    <button
                      type='button'
                      title={`${traumaLabel({
                        ...piece,
                        trauma: piece.trauma,
                      })}${
                        selfHeal
                          ? '. Click to heal itself (uses your turn)'
                          : ''
                      }`}
                      aria-label={traumaLabel({
                        ...piece,
                        trauma: piece.trauma,
                      })}
                      disabled={!selfHeal}
                      onPointerDown={(event) => event.stopPropagation()}
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

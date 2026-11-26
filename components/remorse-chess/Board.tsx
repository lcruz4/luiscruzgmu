import {
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  bishopHealTargets,
  canBeHealed,
  inCheck,
  legalMoves,
} from '@/lib/remorse/engine';
import { cn } from '@/lib/utils';
import type {
  GameState,
  GameStep,
  Piece,
  PromotionType,
} from '@/types/remorse';
import { playSteps } from './animate';
import { Marker } from './Marker';
import { traumaLabel } from './markerSvg';
import { RuleIcon } from './RuleIcon';
import { boardSrc, boardTheme } from '@/lib/remorse/boardThemes';
import { type PieceSetId, pieceSrc } from '@/lib/remorse/pieceSets';
import { useBoardLook } from './useBoardLook';

const FILES = 'abcdefgh';

const isLightSquare = (square: string) =>
  (FILES.indexOf(square[0]) + Number(square[1])) % 2 === 0;

const PROMOTIONS: PromotionType[] = ['q', 'r', 'b', 'n'];

const squaresFor = (flipped: boolean) => {
  const squares: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    for (const file of FILES) squares.push(`${file}${rank}`);
  }
  return flipped ? squares.reverse() : squares;
};

interface BoardProps {
  state: GameState;
  // every step so far; new ones are animated as they arrive
  steps: GameStep[];
  // the first step still being animated, or null once they've all played
  onAnimating: (fromStep: number | null) => void;
  flipped: boolean;
  // the viewer may move the side whose turn it is
  canMove: boolean;
  lastMove: { from: string; to: string } | null;
  onMove: (from: string, to: string, promotion?: PromotionType) => void;
  // a friendly bishop's marker or heal button: it spends the turn healing
  // itself and the hurt pieces next to it
  onSelfHeal: (piece: Piece) => void;
  // tutorial: the only move allowed, highlighted on the board. Without `to`,
  // the bishop on `from` must heal.
  guide?: { from: string; to?: string } | null;
}

export const Board = ({
  state,
  steps,
  onAnimating,
  flipped,
  canMove,
  lastMove,
  onMove,
  onSelfHeal,
  guide,
}: BoardProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const { pieceSet, boardTheme: theme } = useBoardLook();
  const bySquare = new Map(state.pieces.map((piece) => [piece.square, piece]));
  // During a psychopath's extra move only that piece may move
  const isMine = (piece?: Piece) =>
    canMove &&
    piece?.color === state.turn &&
    (!state.extraMovePieceId || piece.id === state.extraMovePieceId) &&
    (!guide || piece.square === guide.from);

  // A pawn reaching the last rank waits for the player to pick its new piece
  const [promotion, setPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const requestMove = (from: string, to: string) => {
    if (!legalMoves(state, from).includes(to)) return;
    if (guide && (from !== guide.from || to !== guide.to)) return;
    const piece = bySquare.get(from);
    const lastRank = piece?.color === 'w' ? '8' : '1';
    if (piece?.type === 'p' && to[1] === lastRank) {
      setPromotion({ from, to });
    } else {
      onMove(from, to);
    }
  };

  const handleClick = (square: string) => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    const piece = bySquare.get(square);
    // A bloodlust piece may take its own side, so a target wins over reselecting
    if (isMine(piece) && !(selected && targets.has(square))) {
      setSelected(selected === square ? null : square);
      return;
    }
    if (selected) {
      requestMove(selected, square);
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

  // Animate steps that arrive after the board first rendered; the first load
  // just shows the board
  const fxRef = useRef<HTMLDivElement>(null);
  const seen = useRef<{ state: GameState; count: number } | null>(null);
  const stopAnimation = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    const last = seen.current;
    seen.current = { state, count: steps.length };
    const board = boardRef.current;
    const fx = fxRef.current;
    if (!last || steps.length <= last.count || !board || !fx) return;
    stopAnimation.current?.();
    onAnimating(last.count);
    const order = squaresFor(flipped);
    stopAnimation.current = playSteps(
      {
        board,
        fx,
        pieceSrc: (color, type) => pieceSrc(pieceSet, color, type),
        at: (square) => {
          const index = order.indexOf(square);
          return { c: index % 8, r: Math.floor(index / 8) };
        },
      },
      last.state,
      state,
      steps.slice(last.count).map((step) => step.events),
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      () => onAnimating(null),
    );
  }, [state, steps, flipped, onAnimating, pieceSet]);
  useEffect(() => () => stopAnimation.current?.(), []);

  const mate = steps
    .at(-1)
    ?.events.find((e) => e.type === 'gameOver' && e.reason === 'checkmate');
  const toppledKing =
    mate?.type === 'gameOver'
      ? state.pieces.find((p) => p.type === 'k' && p.color !== mate.winner)?.id
      : undefined;
  const moveFrom = drag?.from ?? selected;
  const targets = new Set(
    moveFrom
      ? legalMoves(state, moveFrom).filter((to) => !guide || to === guide.to)
      : [],
  );
  const checkedKing =
    !state.winner && inCheck(state, state.turn)
      ? state.pieces.find((p) => p.color === state.turn && p.type === 'k')
          ?.square
      : undefined;

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
    if (to && to !== start.from) requestMove(start.from, to);
  };

  return (
    <div
      ref={boardRef}
      className='relative aspect-square w-full max-w-[min(640px,calc(100dvh-140px))] select-none'
    >
      <img
        src={boardSrc(theme)}
        alt=''
        className='absolute inset-0 h-full w-full rounded-sm'
      />
      <div className='absolute inset-0 grid grid-cols-8 grid-rows-8'>
        {squares.map((square, index) => {
          const piece = bySquare.get(square);
          const canHeal =
            (!guide || (guide.from === square && !guide.to)) &&
            !!piece &&
            isMine(piece) &&
            bishopHealTargets(state, piece).length > 0;
          // A hurt bishop heals from its own marker; one that isn't gets a
          // heal button of its own
          const selfHeal = canHeal && !!piece && canBeHealed(piece);
          const healButton = canHeal && !selfHeal;
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
              {canMove && guide?.from === square && (
                <div className='pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_0_4px_#ffd27a]' />
              )}
              {canMove && guide?.to === square && (
                <div className='pointer-events-none absolute inset-0 z-10 bg-[#ffd27a]/40 shadow-[inset_0_0_0_4px_#ffd27a] motion-safe:animate-pulse' />
              )}
              {checkedKing === square && (
                <div
                  data-check
                  className='pointer-events-none absolute inset-0 bg-red-600/60'
                />
              )}
              {piece && piece.id === state.extraMovePieceId && (
                <div
                  data-extra
                  className='pointer-events-none absolute inset-0 bg-[rgba(229,56,59,0.55)] motion-safe:animate-[remorse-extra_1s_ease-in-out_infinite]'
                />
              )}
              {targets.has(square) && (
                <span
                  className={cn(
                    'pointer-events-none absolute z-20 rounded-full',
                    piece
                      ? 'inset-[4%] border-[5px] border-black/25'
                      : 'inset-[36%] bg-black/25',
                  )}
                />
              )}
              {rankLabel && (
                <span
                  className={cn(
                    'pointer-events-none absolute left-[3%] top-[2%] text-[10px] font-semibold',
                    isLightSquare(square) ? 'text-black/50' : 'text-white/55',
                  )}
                >
                  {square[1]}
                </span>
              )}
              {fileLabel && (
                <span
                  className={cn(
                    'pointer-events-none absolute bottom-[1%] right-[4%] text-[10px] font-semibold',
                    isLightSquare(square) ? 'text-black/50' : 'text-white/55',
                  )}
                >
                  {square[0]}
                </span>
              )}
              {piece && (
                <div
                  data-piece-id={piece.id}
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
                    data-piece-img
                    src={pieceSrc(pieceSet, piece.color, piece.type)}
                    alt={`${piece.color}${piece.type}`}
                    draggable={false}
                    className={cn(
                      'pointer-events-none h-full w-full',
                      piece.trauma === 'psychopath' &&
                        piece.kills >= 3 &&
                        'motion-safe:animate-[remorse-aura_1.1s_ease-in-out_infinite]',
                      piece.id === state.extraMovePieceId &&
                        'motion-safe:animate-[remorse-extra-glow_1s_ease-in-out_infinite]',
                    )}
                    style={
                      piece.id === toppledKing
                        ? {
                            transform: 'rotate(78deg) translateY(-4%)',
                            transformOrigin: '75% 92%',
                          }
                        : undefined
                    }
                  />
                  {piece.trauma && (
                    <button
                      data-marker
                      type='button'
                      title={`${traumaLabel({
                        ...piece,
                        trauma: piece.trauma,
                      })}${
                        selfHeal
                          ? '. Click to heal itself and hurt pieces next to it (uses your turn)'
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
                        !selfHeal &&
                          piece.trauma === 'devastated' &&
                          !piece.healed &&
                          piece.turnsLeft === 1 &&
                          'motion-safe:animate-[remorse-throb_1.2s_ease-in-out_infinite]',
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
                  {healButton && (
                    <button
                      data-heal
                      type='button'
                      title='Click to heal the hurt pieces next to this bishop (uses your turn)'
                      aria-label='Heal the hurt pieces next to this bishop'
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelfHeal(piece);
                      }}
                      className={cn(
                        'absolute -top-[10%] z-10 h-[52%] w-[52%] animate-pulse cursor-pointer rounded-full ring-2 ring-emerald-300 ring-offset-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]',
                        // the marker keeps the top-right corner
                        piece.trauma ? '-left-[10%]' : '-right-[10%]',
                      )}
                    >
                      <RuleIcon rule='heal' className='block h-full w-full' />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div ref={fxRef} className='pointer-events-none absolute inset-0 z-20' />
      {promotion && (
        <PromotionPicker
          color={state.turn}
          pieceSet={pieceSet}
          light={boardTheme(theme).light}
          column={squares.indexOf(promotion.to) % 8}
          fromTop={squares.indexOf(promotion.to) < 8}
          onPick={(type) => {
            onMove(promotion.from, promotion.to, type);
            setPromotion(null);
          }}
          onCancel={() => setPromotion(null)}
        />
      )}
    </div>
  );
};

// Four squares stacked from the promotion square's edge; a click anywhere
// else cancels the move
const PromotionPicker = ({
  color,
  pieceSet,
  light,
  column,
  fromTop,
  onPick,
  onCancel,
}: {
  color: GameState['turn'];
  pieceSet: PieceSetId;
  // the board's light square color
  light: string;
  column: number;
  fromTop: boolean;
  onPick: (type: PromotionType) => void;
  onCancel: () => void;
}) => (
  <div className='absolute inset-0 z-40 bg-black/40' onClick={onCancel}>
    <div
      className={cn(
        'absolute flex w-[12.5%] rounded-sm shadow-lg shadow-black/60',
        fromTop ? 'top-0 flex-col' : 'bottom-0 flex-col-reverse',
      )}
      style={{ left: `${column * 12.5}%`, backgroundColor: light }}
    >
      {PROMOTIONS.map((type) => (
        <button
          key={type}
          type='button'
          aria-label={`Promote to ${type}`}
          className='aspect-square w-full hover:bg-white/30'
          onClick={(event) => {
            event.stopPropagation();
            onPick(type);
          }}
        >
          <img
            src={pieceSrc(pieceSet, color, type)}
            alt=''
            className='h-full w-full'
          />
        </button>
      ))}
    </div>
  </div>
);

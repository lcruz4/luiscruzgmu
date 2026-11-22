import type { CSSProperties } from 'react';
import { boardSrc } from '@/lib/remorse/boardThemes';
import { pieceSrc } from '@/lib/remorse/pieceSets';
import type { Color, PieceType } from '@/types/remorse';
import { Marker } from './Marker';
import type { MarkerProps } from './markerSvg';

// Landing page art: a tilted board filling its box, with a bishop healing a
// devastated knight and a guilt-ridden pawn in the middle. Drawn in the
// default look (Mourners on Reliquary).

const ANGLE = 52;
const SQUARE = 12.5;

const marker = (
  trauma: MarkerProps['trauma'],
  extra: Partial<MarkerProps> = {},
): MarkerProps => ({ trauma, healed: false, turnsLeft: 0, kills: 0, ...extra });

interface ScenePiece {
  // file and row (0 = far edge) on the board, in squares
  at: [number, number];
  color: Color;
  type: PieceType;
  marker?: MarkerProps;
  // lying on the board, rotated this many degrees
  fallen?: number;
  // a fallen piece fading out
  ghost?: boolean;
  heal?: boolean;
  sparkle?: boolean;
}

const PIECES: ScenePiece[] = [
  { at: [3.3, 0.9], color: 'b', type: 'p' },
  {
    at: [6, 1.2],
    color: 'b',
    type: 'q',
    marker: marker('psychopath', { kills: 2 }),
  },
  { at: [5, 0.6], color: 'b', type: 'p' },
  {
    at: [2.6, 2.5],
    color: 'b',
    type: 'p',
    marker: marker('devastated', { turnsLeft: 2 }),
  },
  { at: [1.75, 1.9], color: 'b', type: 'n', marker: marker('unaffected') },
  {
    at: [2.85, 4],
    color: 'w',
    type: 'n',
    marker: marker('devastated', { turnsLeft: 1, healed: true }),
    sparkle: true,
  },
  { at: [4, 4.15], color: 'w', type: 'b', heal: true },
  {
    at: [5.15, 4],
    color: 'w',
    type: 'p',
    marker: marker('guilt', { healed: true }),
    sparkle: true,
  },
  { at: [2.1, 3.6], color: 'b', type: 'p', fallen: 92, ghost: true },
  { at: [1.55, 4.3], color: 'b', type: 'n', fallen: -76 },
  { at: [6.6, 3.0], color: 'w', type: 'p', fallen: 70, ghost: true },
  { at: [6.0, 5.0], color: 'b', type: 'b', fallen: 100 },
  { at: [2.4, 5.6], color: 'w', type: 'p', marker: marker('guilt') },
  { at: [4.7, 6.2], color: 'w', type: 'k' },
  { at: [5.7, 6.2], color: 'w', type: 'r' },
];

// Green plusses around a piece being healed, on a 10×10 grid
const SPARKLES: [number, number, number][] = [
  [1.6, 3.2, 0.3],
  [8.6, 4.6, 0.24],
  [2.2, 6.8, 0.2],
];

const pieceStyle = ({ at: [file, row], fallen }: ScenePiece): CSSProperties =>
  fallen === undefined
    ? {
        left: `${file * SQUARE}%`,
        top: `${(row + 0.5) * SQUARE - SQUARE * 0.92}%`,
        transformOrigin: '50% 92%',
        transform: `rotateX(${-ANGLE}deg)`,
      }
    : {
        left: `${file * SQUARE}%`,
        top: `${row * SQUARE}%`,
        transform: `rotateZ(${fallen}deg) translateZ(1px)`,
      };

const imageFilter = ({ fallen, ghost, heal }: ScenePiece) => {
  if (ghost) return 'grayscale(1) brightness(1.6) opacity(.55)';
  if (fallen !== undefined) return 'brightness(.85)';
  if (heal) {
    return 'drop-shadow(0 0 6px rgba(52,211,153,.75)) drop-shadow(0 0 2px rgba(52,211,153,.8))';
  }
  return undefined;
};

const PIPS = [
  [-1, -1],
  [1, -1],
  [0, 0],
  [-1, 1],
  [1, 1],
];

const Die = () => (
  <svg
    viewBox='-26 -26 52 52'
    className='absolute top-[62%] left-[53%] w-[9.5%] -rotate-[14deg] drop-shadow-[0_8px_10px_rgba(0,0,0,0.55)]'
    aria-hidden
  >
    <rect
      x='-22'
      y='-22'
      width='44'
      height='44'
      rx='9'
      fill='#f7f3ea'
      stroke='#120d0b'
      strokeWidth='3'
    />
    {PIPS.map(([x, y]) => (
      <circle key={`${x}${y}`} cx={x * 11} cy={y * 11} r='4.2' fill='#120d0b' />
    ))}
    <path
      d='M-16 -12c1-4 3-6 6-6.5'
      stroke='#fff'
      strokeWidth='2'
      fill='none'
      strokeLinecap='round'
    />
  </svg>
);

export const HeroScene = () => (
  <div className='absolute inset-0' aria-hidden>
    <div
      className='absolute inset-0'
      style={{ perspective: '1000px', perspectiveOrigin: '50% 0%' }}
    >
      <div
        className='absolute aspect-square bg-size-[100%_100%]'
        style={{
          left: '-38%',
          bottom: '-26%',
          width: '176%',
          transformOrigin: '50% 100%',
          transform: `rotateX(${ANGLE}deg)`,
          transformStyle: 'preserve-3d',
          backgroundImage: `url("${boardSrc('reliquary')}")`,
        }}
      >
        {PIECES.map((piece) => (
          <div
            key={`${piece.color}${piece.type}${piece.at.join()}`}
            className='absolute size-[12.5%]'
            style={{ ...pieceStyle(piece), transformStyle: 'preserve-3d' }}
          >
            <img
              src={pieceSrc('mourners', piece.color, piece.type)}
              alt=''
              className='absolute inset-0 size-full'
              style={{ filter: imageFilter(piece) }}
            />
            {piece.sparkle && (
              <svg
                viewBox='0 0 10 10'
                className='pointer-events-none absolute -top-[10%] -left-[15%] h-[120%] w-[130%] overflow-visible'
              >
                {SPARKLES.map(([x, y, s]) => (
                  <path
                    key={`${x}${y}`}
                    transform={`translate(${x} ${y}) scale(${s})`}
                    d='M-1 -3h2v2h2v2h-2v2h-2v-2h-2v-2h2z'
                    fill='#6ee7b7'
                    stroke='#064e3b'
                    strokeWidth='.5'
                    opacity='.85'
                  />
                ))}
              </svg>
            )}
            {piece.marker && (
              <Marker
                {...piece.marker}
                className='absolute -top-[18%] -right-[14%] block aspect-[64/68] w-[56%] drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]'
              />
            )}
          </div>
        ))}
      </div>
    </div>
    <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(34%_34%_at_50%_52%,rgba(52,211,153,0.1),transparent_70%)] mix-blend-screen' />
    <Die />
  </div>
);

import type { ReactNode } from 'react';

// The lobby's new-game cards, drawn like the board's markers: flat fills
// with a heavy ink outline
const OUT = '#120d0b';
const CREAM = '#f7f3ea';
const GOLD = '#c98a1c';
const GOLD_LIGHT = '#ffd27a';
const RED = '#c62828';

const Svg = ({
  children,
  className = 'block size-[58px] flex-none',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <svg
    viewBox='0 0 64 64'
    className={className}
    aria-hidden='true'
    strokeLinejoin='round'
    strokeLinecap='round'
  >
    {children}
  </svg>
);

const PIPS = [
  [21, 21],
  [43, 21],
  [32, 32],
  [21, 43],
  [43, 43],
];

export const DieIcon = () => (
  <Svg>
    <g transform='rotate(-12 32 32)'>
      <rect
        x='9'
        y='9'
        width='46'
        height='46'
        rx='10'
        fill={CREAM}
        stroke={OUT}
        strokeWidth='3.2'
      />
      {PIPS.map(([cx, cy]) => (
        <circle key={`${cx}${cy}`} cx={cx} cy={cy} r='4' fill={OUT} />
      ))}
    </g>
  </Svg>
);

export const LetterIcon = () => (
  <Svg>
    <rect
      x='6'
      y='15'
      width='52'
      height='36'
      rx='5'
      fill={CREAM}
      stroke={OUT}
      strokeWidth='3'
    />
    <path d='M7 17l25 19 25-19' fill='none' stroke={OUT} strokeWidth='3' />
    <circle cx='32' cy='36' r='9' fill={RED} stroke={OUT} strokeWidth='2.6' />
    <path
      d='M28.5 36.5l2.5 2.5 4.5-5'
      fill='none'
      stroke={CREAM}
      strokeWidth='2.4'
    />
  </Svg>
);

const SQUARES = Array.from({ length: 16 }, (_, i) => [
  i % 4,
  Math.floor(i / 4),
]);

export const BoardIcon = () => (
  <Svg>
    <g transform='rotate(-8 32 36)'>
      {SQUARES.map(([col, row]) => (
        <rect
          key={`${col}${row}`}
          x={10 + col * 11}
          y={14 + row * 11}
          width='11'
          height='11'
          fill={(col + row) % 2 ? '#8a6a48' : '#e8d8b8'}
        />
      ))}
      <rect
        x='10'
        y='14'
        width='44'
        height='44'
        rx='2'
        fill='none'
        stroke={OUT}
        strokeWidth='3'
      />
    </g>
    <path
      d='M8 12c6-8 16-9 24-5M32 7l-6.5-2.5M32 7l-3 6'
      fill='none'
      stroke={GOLD_LIGHT}
      strokeWidth='3.4'
    />
  </Svg>
);

// One sword standing on its point's opposite end; crossed in SwordsIcon
const Sword = ({ angle }: { angle: number }) => (
  <g transform={`rotate(${angle} 32 32)`}>
    <path
      d='M29 40V9l3-4 3 4v31z'
      fill={CREAM}
      stroke={OUT}
      strokeWidth='2.6'
    />
    <rect
      x='21'
      y='39'
      width='22'
      height='5'
      rx='2.5'
      fill={GOLD}
      stroke={OUT}
      strokeWidth='2.4'
    />
    <rect
      x='29.5'
      y='44'
      width='5'
      height='10'
      rx='1.5'
      fill='#6e4a2a'
      stroke={OUT}
      strokeWidth='2.2'
    />
    <circle
      cx='32'
      cy='57'
      r='3.5'
      fill={GOLD}
      stroke={OUT}
      strokeWidth='2.2'
    />
  </g>
);

export const SwordsIcon = () => (
  <Svg>
    <Sword angle={-38} />
    <Sword angle={38} />
  </Svg>
);

// Balance mode: gothic scales, watching. The big die sinks against the
// small one.
export const ScalesIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <g stroke={OUT}>
      <path
        d='M9.6 19.3 3.2 36M9.6 19.3 16 36M54.6 9.7 48.2 26M54.6 9.7 61 26'
        fill='none'
        strokeWidth='1.8'
      />
      <rect
        x='21'
        y='54'
        width='22'
        height='6'
        rx='1.5'
        fill={GOLD}
        strokeWidth='2.6'
      />
      <rect
        x='25'
        y='49.5'
        width='14'
        height='5'
        rx='1'
        fill={GOLD}
        strokeWidth='2.4'
      />
      <path
        d='M29.4 50 30.4 22h3.2l1 28z'
        fill={GOLD_LIGHT}
        strokeWidth='2.4'
      />
      <g transform='rotate(-12 32 15)'>
        <rect
          x='8'
          y='13'
          width='48'
          height='4.6'
          rx='2.3'
          fill={GOLD_LIGHT}
          strokeWidth='2.4'
        />
        <circle cx='8' cy='15.3' r='2.6' fill={GOLD} strokeWidth='2' />
        <circle cx='56' cy='15.3' r='2.6' fill={GOLD} strokeWidth='2' />
      </g>
      <path d='M32 2.5 35.6 10.5h-7.2z' fill={GOLD} strokeWidth='2.2' />
      <rect
        x='3.6'
        y='24.5'
        width='12'
        height='12'
        rx='3'
        fill={CREAM}
        strokeWidth='2.4'
        transform='rotate(-6 9.6 30.5)'
      />
      <circle cx='9.6' cy='29.5' r='2' fill={RED} stroke='none' />
      <rect
        x='50.6'
        y='18.6'
        width='8'
        height='8'
        rx='2'
        fill={CREAM}
        strokeWidth='2.2'
        transform='rotate(8 54.6 22.6)'
      />
      <circle cx='54.6' cy='22.4' r='1.3' fill={OUT} stroke='none' />
      <path
        d='M1.6 35.2h16a8 5.6 0 0 1-16 0zM46.6 25.2h16a8 5.6 0 0 1-16 0z'
        fill={GOLD}
        strokeWidth='2.6'
      />
      <path
        d='M23.5 15Q32 8 40.5 15 32 22 23.5 15z'
        fill={CREAM}
        strokeWidth='2.4'
      />
      <circle cx='32' cy='15' r='2.8' fill={OUT} stroke='none' />
    </g>
  </Svg>
);

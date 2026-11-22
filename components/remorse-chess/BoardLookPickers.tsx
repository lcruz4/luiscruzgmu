import type { ReactNode } from 'react';
import {
  BOARD_THEMES,
  type BoardThemeId,
  boardSrc,
} from '@/lib/remorse/boardThemes';
import { PIECE_SETS, type PieceSetId, pieceSrc } from '@/lib/remorse/pieceSets';
import { cn } from '@/lib/utils';
import type { Color, PieceType } from '@/types/remorse';

// Four board squares behind each piece set: white king and knight, black
// queen and pawn
const SAMPLE: [Color, PieceType][] = [
  ['w', 'k'],
  ['w', 'n'],
  ['b', 'q'],
  ['b', 'p'],
];

const Option = ({
  selected,
  disabled,
  onSelect,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
}) => (
  <button
    type='button'
    role='radio'
    aria-checked={selected}
    disabled={disabled}
    onClick={onSelect}
    className={cn(
      'flex cursor-pointer flex-col gap-2 rounded-lg border-2 p-2 text-left transition disabled:cursor-default',
      selected
        ? 'border-[#c98a1c] bg-[#2c2620]'
        : 'border-[#3a3733] hover:border-[#514d47]',
    )}
  >
    {children}
  </button>
);

// A strip of board squares, `squares` wide, from the board's top-left corner
const Squares = ({
  boardTheme,
  squares,
  children,
}: {
  boardTheme: BoardThemeId;
  squares: number;
  children?: ReactNode;
}) => (
  <span
    className='grid overflow-hidden rounded-sm bg-top-left'
    style={{
      gridTemplateColumns: `repeat(${squares}, minmax(0, 1fr))`,
      backgroundImage: `url("${boardSrc(boardTheme)}")`,
      backgroundSize: `${(8 / squares) * 100}% auto`,
      aspectRatio: children ? `${squares} / 1` : `${squares} / 2`,
    }}
  >
    {children}
  </span>
);

export const BoardThemePicker = ({
  value,
  onChange,
  disabled,
}: {
  value: BoardThemeId;
  onChange: (boardTheme: BoardThemeId) => void;
  disabled?: boolean;
}) => (
  <div
    role='radiogroup'
    aria-label='Board colors'
    className='grid grid-cols-2 gap-2 sm:grid-cols-3'
  >
    {BOARD_THEMES.map((theme) => (
      <Option
        key={theme.id}
        selected={theme.id === value}
        disabled={disabled}
        onSelect={() => onChange(theme.id)}
      >
        <Squares boardTheme={theme.id} squares={4} />
        <span className='px-0.5 font-semibold text-white'>{theme.name}</span>
      </Option>
    ))}
  </div>
);

export const PieceSetPicker = ({
  value,
  boardTheme,
  onChange,
  disabled,
}: {
  value: PieceSetId;
  boardTheme: BoardThemeId;
  onChange: (pieceSet: PieceSetId) => void;
  disabled?: boolean;
}) => (
  <div
    role='radiogroup'
    aria-label='Piece set'
    className='grid grid-cols-1 gap-2 sm:grid-cols-2'
  >
    {PIECE_SETS.map((set) => (
      <Option
        key={set.id}
        selected={set.id === value}
        disabled={disabled}
        onSelect={() => onChange(set.id)}
      >
        <Squares boardTheme={boardTheme} squares={4}>
          {SAMPLE.map(([color, type]) => (
            <img
              key={`${color}${type}`}
              src={pieceSrc(set.id, color, type)}
              alt=''
              className='aspect-square w-full'
            />
          ))}
        </Squares>
        <span className='flex flex-col px-0.5 leading-snug'>
          <span className='font-semibold text-white'>{set.name}</span>
          <span className='text-[12.5px] text-[#a29e96]'>{set.blurb}</span>
        </span>
      </Option>
    ))}
  </div>
);

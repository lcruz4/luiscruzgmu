import {
  BOARD_SRC,
  PIECE_SETS,
  type PieceSetId,
  pieceSrc,
} from '@/lib/remorse/pieceSets';
import { cn } from '@/lib/utils';
import type { Color, PieceType } from '@/types/remorse';

// A strip of four board squares: white king and knight, black queen and pawn
const PREVIEW: [Color, PieceType][] = [
  ['w', 'k'],
  ['w', 'n'],
  ['b', 'q'],
  ['b', 'p'],
];

export const PieceSetPicker = ({
  value,
  onChange,
  disabled,
}: {
  value: PieceSetId;
  onChange: (pieceSet: PieceSetId) => void;
  disabled?: boolean;
}) => (
  <div
    role='radiogroup'
    aria-label='Piece set'
    className='grid grid-cols-1 gap-2 sm:grid-cols-2'
  >
    {PIECE_SETS.map((set) => {
      const selected = set.id === value;
      return (
        <button
          key={set.id}
          type='button'
          role='radio'
          aria-checked={selected}
          disabled={disabled}
          onClick={() => onChange(set.id)}
          className={cn(
            'flex cursor-pointer flex-col gap-2 rounded-lg border-2 p-2 text-left transition disabled:cursor-default',
            selected
              ? 'border-[#c98a1c] bg-[#2c2620]'
              : 'border-[#3a3733] hover:border-[#514d47]',
          )}
        >
          <span
            className='grid grid-cols-4 overflow-hidden rounded-sm bg-size-[200%_auto] bg-top-left'
            style={{ backgroundImage: `url(${BOARD_SRC})` }}
          >
            {PREVIEW.map(([color, type]) => (
              <img
                key={`${color}${type}`}
                src={pieceSrc(set.id, color, type)}
                alt=''
                className='aspect-square w-full'
              />
            ))}
          </span>
          <span className='flex flex-col px-0.5 leading-snug'>
            <span className='font-semibold text-white'>{set.name}</span>
            <span className='text-[12.5px] text-[#a29e96]'>{set.blurb}</span>
          </span>
        </button>
      );
    })}
  </div>
);

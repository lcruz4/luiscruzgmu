import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  type BoardThemeId,
  boardSrc,
  boardTheme,
} from '@/lib/remorse/boardThemes';
import { PIECE_SETS, type PieceSetId, pieceSrc } from '@/lib/remorse/pieceSets';
import type { Color, PieceType } from '@/types/remorse';
import { Marker } from './Marker';
import type { MarkerProps } from './markerSvg';

type SamplePiece = [string, Color, PieceType, MarkerProps?];

// A mid-game position with one of each trauma marker
const POSITION: SamplePiece[] = [
  ['a8', 'b', 'r'],
  ['c8', 'b', 'b'],
  ['d8', 'b', 'q'],
  ['e8', 'b', 'k'],
  ['h8', 'b', 'r'],
  ['a7', 'b', 'p'],
  ['b7', 'b', 'p'],
  ['c7', 'b', 'p'],
  ['f7', 'b', 'p'],
  ['g7', 'b', 'p'],
  ['h7', 'b', 'p'],
  ['c6', 'b', 'n'],
  [
    'f6',
    'b',
    'n',
    { trauma: 'unaffected', healed: false, turnsLeft: 0, kills: 0 },
  ],
  ['c5', 'b', 'b'],
  [
    'd5',
    'b',
    'p',
    { trauma: 'devastated', healed: false, turnsLeft: 2, kills: 0 },
  ],
  ['e5', 'b', 'p'],
  [
    'c4',
    'w',
    'b',
    { trauma: 'psychopath', healed: false, turnsLeft: 0, kills: 3 },
  ],
  ['e4', 'w', 'p'],
  ['d3', 'w', 'p'],
  ['f3', 'w', 'n', { trauma: 'guilt', healed: false, turnsLeft: 0, kills: 0 }],
  ['a2', 'w', 'p'],
  ['b2', 'w', 'p'],
  ['c2', 'w', 'p'],
  ['f2', 'w', 'p'],
  ['g2', 'w', 'p'],
  ['h2', 'w', 'p'],
  ['a1', 'w', 'r'],
  ['b1', 'w', 'n'],
  ['c1', 'w', 'b'],
  ['d1', 'w', 'q'],
  ['f1', 'w', 'r'],
  ['g1', 'w', 'k'],
];

const at = (square: string) => ({
  left: `${(square.charCodeAt(0) - 97) * 12.5}%`,
  top: `${(8 - Number(square[1])) * 12.5}%`,
});

export const BoardPreview = ({
  pieceSet,
  board,
}: {
  pieceSet: PieceSetId;
  board: BoardThemeId;
}) => {
  const setName = PIECE_SETS.find((set) => set.id === pieceSet)?.name;
  return (
    <Dialog>
      <DialogTrigger className='cursor-pointer text-sm font-medium text-[#ffd27a] hover:underline'>
        Preview board
      </DialogTrigger>
      <DialogContent className='max-w-[min(92vw,600px)] gap-3 border-[#3a3733] bg-[#262421] p-4 font-sans text-[#e8e6e1] [&>button]:text-white'>
        <DialogTitle className='text-base font-semibold text-white'>
          {setName} on {boardTheme(board).name}
        </DialogTitle>
        <DialogDescription className='-mt-2 text-[13px] text-[#a29e96]'>
          A game in progress, with the four trauma markers.
        </DialogDescription>
        <div className='relative mx-auto aspect-square w-full max-w-[calc(100dvh-140px)] select-none'>
          <img
            src={boardSrc(board)}
            alt=''
            className='absolute inset-0 size-full rounded-sm'
          />
          {POSITION.map(([square, color, type, marker]) => (
            <div
              key={square}
              className='absolute size-[12.5%]'
              style={at(square)}
            >
              <img
                src={pieceSrc(pieceSet, color, type)}
                alt=''
                className='size-full'
              />
              {marker && (
                <Marker
                  {...marker}
                  className='absolute -top-[10%] -right-[10%] block size-[52%] drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]'
                />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

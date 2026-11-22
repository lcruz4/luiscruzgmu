import { boardSrc } from '@/lib/remorse/boardThemes';
import { pieceSrc } from '@/lib/remorse/pieceSets';
import type { GameSummary } from '@/types/remorse';
import { useBoardLook } from './useBoardLook';

// A thumbnail of the position, from `flipped` = black's side
export const MiniBoard = ({
  pieces,
  flipped,
}: {
  pieces: GameSummary['pieces'];
  flipped: boolean;
}) => {
  const { pieceSet, boardTheme } = useBoardLook();
  return (
    <span
      className='relative block size-14 flex-none overflow-hidden rounded-md border border-[#120d0b] bg-cover'
      style={{ backgroundImage: `url("${boardSrc(boardTheme)}")` }}
    >
      {pieces.map(({ color, type, square }) => {
        const file = square.charCodeAt(0) - 97;
        const rank = Number(square[1]) - 1;
        const col = flipped ? 7 - file : file;
        const row = flipped ? rank : 7 - rank;
        return (
          <img
            key={square}
            src={pieceSrc(pieceSet, color, type)}
            alt=''
            className='absolute size-[12.5%]'
            style={{ left: `${col * 12.5}%`, top: `${row * 12.5}%` }}
          />
        );
      })}
    </span>
  );
};

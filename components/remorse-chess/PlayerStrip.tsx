import { colorName } from '@/lib/remorse/describe';
import type { PlayerIcon } from '@/lib/remorse/icons';
import { cn } from '@/lib/utils';
import type { Color, GameResponse } from '@/types/remorse';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerLink } from './PlayerLink';

// One side of the board: who plays it and whether it's their move
export const PlayerStrip = ({
  game,
  color,
  toMove,
  inCheck,
}: {
  game: GameResponse;
  color: Color;
  toMove: boolean;
  inCheck: boolean;
}) => {
  const local = game.mode === 'local';
  const name = local
    ? colorName(color)
    : color === 'w'
    ? game.whiteName
    : game.blackName;
  const icon: PlayerIcon | null = local
    ? color === 'w'
      ? 'wk'
      : 'bk'
    : color === 'w'
    ? game.whiteIcon
    : game.blackIcon;
  const you = !local && game.you.includes(color);

  return (
    <div className='flex items-center gap-2.5 px-1 py-2'>
      <PlayerAvatar
        icon={name || local ? icon : null}
        className={cn(
          'size-9',
          !name && 'opacity-40',
          toMove && 'ring-2 ring-[#c98a1c] ring-offset-2 ring-offset-[#161512]',
        )}
      />
      <div className='min-w-0 flex-1 leading-tight'>
        <div className='flex items-center gap-1.5'>
          <strong
            className={cn(
              'truncate font-semibold',
              name ? 'text-white' : 'text-[#a29e96]',
            )}
          >
            {name && !local ? (
              <PlayerLink id={color === 'w' ? game.whiteId : game.blackId}>
                {name}
              </PlayerLink>
            ) : (
              name ?? 'Waiting for a player'
            )}
          </strong>
          {you && <span className='text-xs text-[#a29e96]'>(you)</span>}
        </div>
        <span className='flex items-center gap-1.5 text-xs text-[#a29e96]'>
          <span
            className={cn(
              'inline-block size-2.5 rounded-full border',
              color === 'w'
                ? 'border-[#120d0b] bg-[#f7f3ea]'
                : 'border-[#6b665e] bg-[#2b2724]',
            )}
          />
          {colorName(color)}
        </span>
      </div>
      {toMove && (
        <span
          className={cn(
            'flex-none rounded-full border px-2.5 py-0.5 text-xs font-semibold',
            inCheck
              ? 'border-red-400/50 bg-red-900/40 text-red-200'
              : 'border-[#c98a1c]/45 bg-[#c98a1c]/15 text-[#ffd27a]',
          )}
        >
          {inCheck ? 'In check' : 'To move'}
        </span>
      )}
    </div>
  );
};

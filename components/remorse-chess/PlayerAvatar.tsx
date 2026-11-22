import { useId } from 'react';
import {
  DEFAULT_ICON,
  isMedallionIcon,
  isPawnIcon,
  type MedallionIcon,
  type PawnIcon,
  medallionTrauma,
  type PlayerIcon,
} from '@/lib/remorse/icons';
import { cn } from '@/lib/utils';
import { healSvg } from './landingArt';
import { medallionSvg } from './markerSvg';
import { pawnIconSvg, pawnShape } from './pawnIcons';

// SVG strings come from our own art constants, never user input
const Medallion = ({ icon }: { icon: MedallionIcon }) => {
  const id = `a${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const html =
    icon === 'heal'
      ? healSvg(id)
      : medallionSvg(id, medallionTrauma(icon), icon === 'bloodlust');
  return (
    <span
      className='block size-full'
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

const Pawn = ({ icon }: { icon: PawnIcon }) => {
  const id = `p${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <span
      className='block size-full'
      dangerouslySetInnerHTML={{ __html: pawnIconSvg(id, icon) }}
    />
  );
};

// A player's icon in a round frame; size it with className. Medallions are
// their own frame and fill it.
export const PlayerAvatar = ({
  icon,
  className,
}: {
  icon: PlayerIcon | null;
  className?: string;
}) => {
  const shown = icon ?? DEFAULT_ICON;
  if (isPawnIcon(shown)) {
    const shape = pawnShape(shown);
    return (
      <span
        className={cn(
          'block size-8 flex-none overflow-hidden rounded-full',
          shape !== 'medallion' && 'border-2 border-[#120d0b]',
          shape === 'figure' && 'bg-[#302d29]',
          className,
        )}
      >
        <Pawn icon={shown} />
      </span>
    );
  }
  if (isMedallionIcon(shown)) {
    return (
      <span className={cn('block size-8 flex-none rounded-full', className)}>
        <Medallion icon={shown} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        'grid size-8 flex-none place-items-center overflow-hidden rounded-full border-2 border-[#514d47]',
        // pieces sit on the board's own square colors so black ones show
        shown.startsWith('w') ? 'bg-[#739552]' : 'bg-[#ebecd0]',
        className,
      )}
    >
      <img src={`/images/${shown}.png`} alt='' className='size-[86%]' />
    </span>
  );
};

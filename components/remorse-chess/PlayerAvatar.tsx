import { useId } from 'react';
import {
  DEFAULT_ICON,
  isMedallionIcon,
  type MedallionIcon,
  medallionTrauma,
  type PlayerIcon,
} from '@/lib/remorse/icons';
import { cn } from '@/lib/utils';
import { healSvg } from './landingArt';
import { medallionSvg } from './markerSvg';

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

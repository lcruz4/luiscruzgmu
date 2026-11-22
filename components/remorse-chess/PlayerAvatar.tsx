import {
  DEFAULT_ICON,
  isMarkerIcon,
  markerTrauma,
  type PlayerIcon,
} from '@/lib/remorse/icons';
import { cn } from '@/lib/utils';
import { Marker } from './Marker';

// A player's icon in a round frame; size it with className
export const PlayerAvatar = ({
  icon,
  className,
}: {
  icon: PlayerIcon | null;
  className?: string;
}) => {
  const shown = icon ?? DEFAULT_ICON;
  return (
    <span
      className={cn(
        'grid size-8 flex-none place-items-center overflow-hidden rounded-full border-2 border-[#514d47]',
        // pieces sit on the board's own square colors so black ones show
        isMarkerIcon(shown)
          ? 'bg-[#302d29]'
          : shown.startsWith('w')
          ? 'bg-[#739552]'
          : 'bg-[#ebecd0]',
        className,
      )}
    >
      {isMarkerIcon(shown) ? (
        <Marker
          trauma={markerTrauma(shown)}
          healed={false}
          turnsLeft={shown === 'devastated' ? 3 : 0}
          kills={shown === 'bloodlust' ? 3 : 0}
          className='block aspect-[64/68] w-[96%]'
        />
      ) : (
        <img src={`/images/${shown}.png`} alt='' className='size-[86%]' />
      )}
    </span>
  );
};

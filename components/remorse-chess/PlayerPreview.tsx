import type { PlayerIcon } from '@/lib/remorse/icons';
import { PlayerAvatar } from './PlayerAvatar';
import { Rating } from './Rating';

// How opponents will see a name and icon that are still being edited
export const PlayerPreview = ({
  icon,
  username,
  rating,
}: {
  icon: PlayerIcon | null;
  username: string;
  rating?: number;
}) => (
  <div className='flex items-center gap-3 rounded-lg bg-[#1d1b18] p-3'>
    <PlayerAvatar icon={icon} className='size-12' />
    <div className='min-w-0'>
      <strong className='flex min-w-0 items-baseline gap-1.5 text-white'>
        <span className='truncate'>{username.trim() || 'Your name'}</span>
        <Rating rating={rating} className='text-sm' />
      </strong>
      <span className='text-[13px] text-[#a29e96]'>How opponents see you</span>
    </div>
  </div>
);

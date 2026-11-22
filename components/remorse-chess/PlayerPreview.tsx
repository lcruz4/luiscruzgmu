import type { PlayerIcon } from '@/lib/remorse/icons';
import { PlayerAvatar } from './PlayerAvatar';

// How opponents will see a name and icon that are still being edited
export const PlayerPreview = ({
  icon,
  username,
}: {
  icon: PlayerIcon | null;
  username: string;
}) => (
  <div className='flex items-center gap-3 rounded-lg bg-[#1d1b18] p-3'>
    <PlayerAvatar icon={icon} className='size-12' />
    <div className='min-w-0'>
      <strong className='block truncate text-white'>
        {username.trim() || 'Your name'}
      </strong>
      <span className='text-[13px] text-[#a29e96]'>How opponents see you</span>
    </div>
  </div>
);

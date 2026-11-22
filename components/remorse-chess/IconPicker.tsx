import {
  DEFAULT_ICON,
  PLAYER_ICONS,
  type PlayerIcon,
} from '@/lib/remorse/icons';
import { cn } from '@/lib/utils';
import { PlayerAvatar } from './PlayerAvatar';

export const IconPicker = ({
  value,
  onChange,
  disabled,
}: {
  value: PlayerIcon | null;
  onChange: (icon: PlayerIcon) => void;
  disabled?: boolean;
}) => {
  const selected = value ?? DEFAULT_ICON;
  return (
    <div
      role='radiogroup'
      aria-label='Icon'
      className='grid max-w-[360px] grid-cols-6 gap-2'
    >
      {PLAYER_ICONS.map((icon) => (
        <button
          key={icon}
          type='button'
          role='radio'
          aria-checked={icon === selected}
          aria-label={icon}
          disabled={disabled}
          onClick={() => onChange(icon)}
          className={cn(
            'grid cursor-pointer place-items-center rounded-full p-0.5 transition disabled:cursor-default',
            icon === selected
              ? 'bg-linear-to-b from-[#ffd27a] to-[#c98a1c]'
              : 'hover:bg-[#3a3733]',
          )}
        >
          <PlayerAvatar
            icon={icon}
            className={cn('size-10', icon === selected && 'border-[#120d0b]')}
          />
        </button>
      ))}
    </div>
  );
};

import {
  DEFAULT_ICON,
  ICON_GROUPS,
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
    <div role='radiogroup' aria-label='Icon' className='flex flex-col gap-3'>
      {ICON_GROUPS.map(({ label, icons }) => (
        <div key={label} className='flex flex-col gap-1.5'>
          <span className='text-xs font-semibold tracking-wide text-[#a29e96] uppercase'>
            {label}
          </span>
          <div className='grid max-w-[360px] grid-cols-6 gap-2'>
            {icons.map((icon) => (
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
                <PlayerAvatar icon={icon} className='size-10' />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

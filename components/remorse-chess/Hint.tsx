import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Text that shows over its trigger on hover, or on focus where there's no
// hover (a tap focuses the trigger)
export const Hint = ({
  text,
  children,
  className,
  align = 'left',
}: {
  text: string;
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right';
}) => (
  <div
    tabIndex={0}
    className={cn('group/hint relative outline-none', className)}
  >
    {children}
    <span
      role='tooltip'
      className={cn(
        'pointer-events-none invisible absolute bottom-full z-40 mb-2 w-max max-w-60 rounded-lg border border-[#3a3733] bg-[#1d1b18] px-3 py-2 text-left text-[13px] leading-snug font-normal text-[#e8e4dc] opacity-0 shadow-xl transition-opacity group-hover/hint:visible group-hover/hint:opacity-100 group-focus/hint:visible group-focus/hint:opacity-100',
        align === 'left' ? 'left-0' : 'right-0',
      )}
    >
      {text}
    </span>
  </div>
);

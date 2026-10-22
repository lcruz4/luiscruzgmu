import { cn } from '@/lib/utils';
import { PASS_FAIL_WEEK } from '@/lib/workout/schedule';

export const cardClass =
  'rounded-2xl border border-mist-line bg-mist-surface shadow-mist-card';

export const labelClass =
  'text-[11px] font-bold tracking-[0.08em] text-mist-muted uppercase';

// Open card / header rule: pink in Week 2, cyan otherwise (D26)
export const accentBorder = (week: number) =>
  week === PASS_FAIL_WEEK ? 'border-mist-pink' : 'border-mist-cyan-line';

// Position number in a circle; given a week, it takes that week's accent
export const badgeClass = (week?: number) =>
  cn(
    'flex size-7 shrink-0 items-center justify-center rounded-full border-2 font-num text-[13px] font-bold',
    week === undefined
      ? 'border-mist-line text-mist-muted'
      : week === PASS_FAIL_WEEK
      ? 'border-mist-pink text-mist-pink-text'
      : 'border-mist-cyan-line text-mist-cyan-text',
  );

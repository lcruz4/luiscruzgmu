export const cardClass =
  'rounded-2xl border border-mist-line bg-mist-surface shadow-mist-card';

export const labelClass =
  'text-[11px] font-bold tracking-[0.08em] text-mist-muted uppercase';

const buttonBase =
  'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[14px] px-[18px] text-[15px] font-bold disabled:cursor-default disabled:opacity-50';

export const primaryButton = `${buttonBase} bg-mist-cyan font-extrabold text-mist-ink`;

export const secondaryButton = `${buttonBase} border border-mist-line bg-mist-surface text-mist-text`;

export const money = (value: number) => `$${value.toFixed(2)}`;

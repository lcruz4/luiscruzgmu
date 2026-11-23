import { cn } from '@/lib/utils';

// Remorse button looks. Pair a skin with a size: cn(goldButton, buttonMd)
const base =
  'inline-flex cursor-pointer items-center justify-center rounded-[10px] border-2 font-semibold disabled:cursor-default disabled:opacity-50';

export const goldButton = cn(
  base,
  'border-[#120d0b] bg-linear-to-b from-[#ffd27a] to-[#c98a1c] text-[#1a1209] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_#120d0b] hover:brightness-105',
);

export const ghostButton = cn(
  base,
  'border-[#514d47] bg-[#302d29] text-[#e8e4dc] hover:bg-[#3a3733]',
);

export const redButton = cn(
  base,
  'border-[#120d0b] bg-linear-to-b from-[#e5484d] to-[#a3161b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_2px_0_#120d0b] hover:brightness-110',
);

export const buttonSm = 'gap-2 px-3.5 py-2 text-sm';
export const buttonMd = 'gap-2.5 px-4 py-2.5 text-[15px]';

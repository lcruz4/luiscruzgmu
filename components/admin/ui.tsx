import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export const INPUT =
  'h-8 rounded border border-[#1e2a44] bg-[#0b0f1a] px-2 text-sm text-[#d6e2ff] placeholder:text-[#4b5a7d] focus:border-[#22d3ee] focus:outline-none';
export const GHOST_BTN =
  'inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-xs font-medium transition-colors disabled:opacity-50';
export const PRIMARY_BTN = `${GHOST_BTN} border-[#22d3ee] bg-[#22d3ee] text-[#04202a] hover:bg-[#67e8f9]`;
export const SECONDARY_BTN = `${GHOST_BTN} border-[#1e2a44] text-[#7b8bb0] hover:text-[#d6e2ff]`;
export const CELL = 'px-4 py-3 align-middle';
export const OUTLINE_ACCENT =
  'border-[#22d3ee55] text-[#67e8f9] hover:bg-[#22d3ee1a]';
export const OUTLINE_DANGER =
  'border-[#f472b666] text-[#f472b6] hover:bg-[#f472b61f]';
export const LABEL = 'font-mono text-[11px] tracking-[0.15em] text-[#4b5a7d]';

export const ErrorText = ({ error }: { error: Error | null }) =>
  error ? <p className='mt-1 text-xs text-[#f472b6]'>{error.message}</p> : null;

const TONES = {
  danger: {
    idle: 'border-transparent text-[#7b8bb0] hover:border-[#f472b666] hover:text-[#f472b6]',
    armed: 'border-[#f472b6] bg-[#f472b61f] text-[#f472b6]',
  },
  accent: {
    idle: 'border-[#1e2a44] text-[#7b8bb0] hover:border-[#22d3ee66] hover:text-[#67e8f9]',
    armed: 'border-[#fbbf24] bg-[#fbbf241f] text-[#fbbf24]',
  },
};

// The first click arms it (showing confirmLabel for 3s), the second acts.
// Without confirm it acts on the first click. idle overrides the tone's
// unarmed look.
export const ConfirmButton = ({
  icon,
  label,
  confirmLabel,
  onConfirm,
  pending,
  error,
  tone = 'danger',
  confirm = true,
  idle,
}: {
  icon: ReactNode;
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  pending: boolean;
  error: Error | null;
  tone?: keyof typeof TONES;
  confirm?: boolean;
  idle?: string;
}) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timeout = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timeout);
  }, [armed]);

  const onClick = () => {
    if (confirm && !armed) return setArmed(true);
    setArmed(false);
    onConfirm();
  };

  return (
    <div className='flex flex-col items-end'>
      <button
        type='button'
        disabled={pending}
        onClick={onClick}
        className={`${GHOST_BTN} ${
          armed ? TONES[tone].armed : idle ?? TONES[tone].idle
        }`}
      >
        {pending ? <Loader2 className='size-3.5 animate-spin' /> : icon}
        {armed ? confirmLabel : label}
      </button>
      <ErrorText error={error} />
    </div>
  );
};

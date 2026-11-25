import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { gamePath } from '@/lib/remorse/paths';
import { cn } from '@/lib/utils';
import type {
  BalanceSuggestion,
  Color,
  GameResponse,
  Trauma,
} from '@/types/remorse';
import { buttonSm, ghostButton, goldButton } from './buttons';
import { ScalesIcon } from './ModeIcons';
import { useAnswerBalanceSuggestion, useCreateGame } from './useGame';

export const BalancedTag = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'inline-flex flex-none items-center gap-1 rounded-full border border-[#c98a1c]/45 bg-[#c98a1c]/15 py-px pr-2 pl-1 text-xs font-semibold text-[#ffd27a]',
      className,
    )}
  >
    <ScalesIcon className='block size-4' />
    Balanced
  </span>
);

// An on/off switch in the board's colors
export const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) => (
  <button
    type='button'
    role='switch'
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative h-6 w-10 flex-none cursor-pointer rounded-full border-2 border-[#120d0b] transition-colors',
      checked ? 'bg-[#c98a1c]' : 'bg-[#3a3733]',
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 size-4 rounded-full bg-[#f7f3ea] transition-[left]',
        checked ? 'left-[18px]' : 'left-0.5',
      )}
    />
  </button>
);

const ODDS: [Trauma, string][] = [
  ['devastated', 'Devastated'],
  ['guilt', 'Guilt'],
  ['unaffected', 'Unaffected'],
  ['psychopath', 'Psychopath'],
];

const percent = (chance: number) => `${Math.round(chance * 100)}%`;

// Each side's first-capture odds in a balanced game
export const BalanceOdds = ({ game }: { game: GameResponse }) => {
  if (!game.balanced) return null;
  const side = (color: Color) =>
    (color === 'w' ? game.whiteName : game.blackName) ??
    (color === 'w' ? 'White' : 'Black');
  return (
    <section className='rounded-xl border border-[#c98a1c]/30 bg-[#262421] p-3.5'>
      <div className='flex items-center gap-2.5'>
        <ScalesIcon className='block size-9 flex-none' />
        <div className='leading-tight'>
          <h2 className='font-semibold text-white'>Balanced game</h2>
          <span className='text-[13px] text-[#a29e96]'>
            Unrated. The die leans toward the lower-rated player.
          </span>
        </div>
      </div>
      {game.balance && (
        <table className='mt-3 w-full text-[13px] tabular-nums'>
          <thead>
            <tr className='text-left text-[11px] text-[#a29e96]'>
              <th className='pb-1 font-normal'>First capture</th>
              {ODDS.map(([trauma, label]) => (
                <th key={trauma} className='pb-1 text-right font-normal'>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(['w', 'b'] as const).map((color) => (
              <tr key={color} className='text-[#e8e4dc]'>
                <td className='max-w-24 truncate py-0.5 pr-2 font-semibold'>
                  {side(color)}
                </td>
                {ODDS.map(([trauma]) => (
                  <td key={trauma} className='py-0.5 text-right'>
                    {game.balance && percent(game.balance[color][trauma])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

// After a lopsided run of standard games against someone you follow back:
// offer a balanced challenge. Either answer stops it coming back.
export const BalanceSuggestionDialog = ({
  suggestion,
}: {
  suggestion: BalanceSuggestion | null;
}) => {
  const router = useRouter();
  const answer = useAnswerBalanceSuggestion();
  const create = useCreateGame();
  const [closed, setClosed] = useState(false);
  if (!suggestion) return null;
  const { playerId, name, games, wins, losses } = suggestion;
  const youLead = wins > losses;
  const decline = () => {
    setClosed(true);
    answer.mutate({ playerId, accepted: false });
  };
  const accept = () =>
    answer.mutate(
      { playerId, accepted: true },
      {
        onSuccess: () =>
          create.mutate(
            { challenge: playerId, balanced: true },
            { onSuccess: ({ id }) => router.push(gamePath(id)) },
          ),
      },
    );
  const error = answer.error ?? create.error;
  return (
    <Dialog open={!closed} onOpenChange={(open) => !open && decline()}>
      <DialogContent className='max-w-[calc(100%-32px)] gap-3 rounded-2xl border-[#3a3733] bg-[#262421] p-5 text-center font-sans text-[#e8e6e1] sm:max-w-sm sm:rounded-2xl [&>button]:text-[#a29e96]'>
        <ScalesIcon className='mx-auto block size-20' />
        <DialogTitle className='text-lg font-bold text-white'>
          {youLead
            ? `${name} could use better odds`
            : `Even the odds against ${name}?`}
        </DialogTitle>
        <DialogDescription className='text-[13.5px] text-[#a29e96]'>
          {youLead
            ? `You’ve won ${wins} of your ${games} games against them.`
            : `They’ve won ${losses} of your ${games} games against them.`}{' '}
          In a balanced game the die leans toward whoever is rated lower, and it
          doesn’t count toward ratings.
        </DialogDescription>
        {error && <p className='text-sm text-red-300'>{error.message}</p>}
        <div className='flex justify-center gap-2'>
          <button
            type='button'
            className={cn(goldButton, buttonSm)}
            disabled={answer.isPending || create.isPending}
            onClick={accept}
          >
            Challenge balanced
          </button>
          <button
            type='button'
            className={cn(ghostButton, buttonSm)}
            disabled={answer.isPending || create.isPending}
            onClick={decline}
          >
            No thanks
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

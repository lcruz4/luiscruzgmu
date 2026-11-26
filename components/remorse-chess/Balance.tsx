import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  adjustPercents,
  balancedOdds,
  FAIR_ODDS,
  roundPercents,
  toPercents,
  TRAUMAS,
  traumaOdds,
  type TraumaPercents,
} from '@/lib/remorse/balance';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { gamePath } from '@/lib/remorse/paths';
import { TRAUMA_STYLE } from '@/lib/remorse/traumaStyle';
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
import { VialRack } from './VialRack';

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

const percent = (chance: number) => `${Math.round(chance * 100)}%`;

// A side's player. A challenge's empty seat can only go to the challenged
// player, so it's theirs already.
const seatOf = (game: GameResponse, color: Color) => {
  const white = color === 'w';
  const email = white ? game.whiteEmail : game.blackEmail;
  if (email === null && game.challenge) {
    return { name: game.challenge.name, rating: game.challenge.rating };
  }
  return {
    name:
      (white ? game.whiteName : game.blackName) ?? (white ? 'White' : 'Black'),
    rating: white ? game.whiteRating : game.blackRating,
  };
};

// Each side's first-capture odds in a balanced game. Its creator can set
// them by hand until the first move; the dialog opens on its own until they
// have.
export const BalanceOdds = ({
  game,
  busy,
  onSetOdds,
}: {
  game: GameResponse;
  busy: boolean;
  onSetOdds: (odds: Record<Color, TraumaPercents>) => void;
}) => {
  const [editing, setEditing] = useState(
    game.canSetOdds && !game.balanceCustom,
  );
  if (!game.balanced) return null;
  return (
    <section className='rounded-xl border border-[#c98a1c]/30 bg-[#262421] p-3.5'>
      <div className='flex items-center gap-2.5'>
        <ScalesIcon className='block size-9 flex-none' />
        <div className='leading-tight'>
          <h2 className='font-semibold text-white'>Balanced game</h2>
          <span className='text-[13px] text-[#a29e96]'>
            {game.balanceCustom
              ? 'Unrated. The odds were set by hand.'
              : 'Unrated. The die leans toward the lower-rated player.'}
          </span>
        </div>
      </div>
      {game.balance && (
        <table className='mt-3 w-full text-[13px] tabular-nums'>
          <thead>
            <tr className='text-left text-[11px] text-[#a29e96]'>
              <th className='pb-1 font-normal'>First capture</th>
              {TRAUMAS.map((trauma) => (
                <th key={trauma} className='pb-1 text-right font-normal'>
                  {TRAUMA_STYLE[trauma].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(['w', 'b'] as const).map((color) => (
              <tr key={color} className='text-[#e8e4dc]'>
                <td className='max-w-24 truncate py-0.5 pr-2 font-semibold'>
                  {seatOf(game, color).name}
                </td>
                {TRAUMAS.map((trauma) => (
                  <td key={trauma} className='py-0.5 text-right'>
                    {game.balance && percent(game.balance[color][trauma])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {game.canSetOdds && (
        <button
          type='button'
          className={cn(goldButton, buttonSm, 'mt-3 w-full')}
          disabled={busy}
          onClick={() => setEditing(true)}
        >
          {game.balanceCustom ? 'Change the odds' : 'Set the odds'}
        </button>
      )}
      {editing && game.canSetOdds && (
        <OddsDialog
          game={game}
          onClose={() => setEditing(false)}
          onSave={(odds) => {
            onSetOdds(odds);
            setEditing(false);
          }}
        />
      )}
    </section>
  );
};

const same = (a: TraumaPercents, b: TraumaPercents) =>
  TRAUMAS.every((trauma) => a[trauma] === b[trauma]);

const DEFAULT_PERCENTS = toPercents(traumaOdds(FAIR_ODDS));
const EQUAL_PERCENTS: TraumaPercents = {
  devastated: 25,
  guilt: 25,
  unaffected: 25,
  psychopath: 25,
};

// A button whose description shows on hover or focus
const PresetButton = ({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) => (
  <span className='group relative'>
    <button
      type='button'
      className={cn(ghostButton, buttonSm)}
      onClick={onClick}
    >
      {label}
    </button>
    <span
      role='tooltip'
      className='pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-56 rounded-lg border border-[#514d47] bg-[#1b1917] px-3 py-2 text-left text-xs leading-snug text-[#e8e4dc] shadow-lg group-hover:block group-has-[:focus-visible]:block'
    >
      {description}
    </span>
  </span>
);

const OddsDialog = ({
  game,
  onClose,
  onSave,
}: {
  game: GameResponse;
  onClose: () => void;
  onSave: (odds: Record<Color, TraumaPercents>) => void;
}) => {
  const white = seatOf(game, 'w');
  const black = seatOf(game, 'b');
  const ratings =
    white.rating !== null && black.rating !== null
      ? { w: white.rating, b: black.rating }
      : null;
  const formula = ratings && {
    w: toPercents(traumaOdds(balancedOdds(ratings.w, ratings.b))),
    b: toPercents(traumaOdds(balancedOdds(ratings.b, ratings.w))),
  };
  const [draft, setDraft] = useState<Record<Color, TraumaPercents>>(
    () =>
      (game.balance && {
        w: toPercents(game.balance.w),
        b: toPercents(game.balance.b),
      }) ??
      formula ?? { w: DEFAULT_PERCENTS, b: DEFAULT_PERCENTS },
  );
  // Off: one rack sets both sides. Off until the opponent is known, since
  // there's nothing to tell the sides apart by.
  const [separate, setSeparate] = useState(
    ratings !== null && !same(draft.w, draft.b),
  );
  const [locked, setLocked] = useState<Record<Color, Trauma[]>>({
    w: [],
    b: [],
  });
  const both = (percents: TraumaPercents) => {
    setDraft({ w: percents, b: percents });
    setSeparate(false);
  };
  const racks: { key: Color; title: React.ReactNode }[] = separate
    ? (['w', 'b'] as const).map((color) => ({
        key: color,
        title: (
          <>
            <SideDot color={color} />
            <span className='truncate'>{seatOf(game, color).name}</span>
          </>
        ),
      }))
    : [
        {
          key: 'w',
          title: (
            <>
              <SideDot color='w' />
              <SideDot color='b' className='-ml-2.5' />
              Both players
            </>
          ),
        },
      ];
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[calc(100dvh-24px)] max-w-[calc(100%-24px)] gap-3 overflow-y-auto rounded-2xl border-[#3a3733] bg-[#262421] p-4 font-sans text-[#e8e6e1] sm:max-w-[680px] sm:rounded-2xl sm:p-5 [&>button]:text-[#a29e96]'>
        <div className='flex items-center gap-3 pr-6'>
          <ScalesIcon className='block size-12 flex-none' />
          <div>
            <DialogTitle className='text-lg font-bold text-white'>
              Set the odds
            </DialogTitle>
            <DialogDescription className='text-[13px] text-[#a29e96]'>
              What a piece suffers after its first capture. Raise or lower a
              vial and the unlocked ones make room. Fixed once the first move is
              played.
            </DialogDescription>
          </div>
        </div>
        <label className='flex cursor-pointer items-center gap-2.5 self-start text-sm text-[#e8e4dc]'>
          <Toggle
            checked={separate}
            label='Separate odds'
            onChange={(on) => {
              setSeparate(on);
              if (!on) setDraft((current) => ({ w: current.w, b: current.w }));
            }}
          />
          <span className='whitespace-nowrap'>Separate odds</span>
          <span className='text-xs text-[#a29e96]'>
            {separate ? 'Each player has their own vials' : 'One set for both'}
          </span>
        </label>
        <div
          className={cn(
            'grid gap-3',
            separate ? 'sm:grid-cols-2' : 'mx-auto w-full max-w-[340px]',
          )}
        >
          {racks.map(({ key, title }) => (
            <div key={key} className='flex flex-col gap-1.5'>
              <h3 className='flex items-center gap-2 text-sm font-semibold text-white'>
                {title}
              </h3>
              <VialRack
                percents={draft[key]}
                locked={locked[key]}
                onAdjust={(trauma, to) =>
                  setDraft((current) => {
                    const next = adjustPercents(
                      current[key],
                      locked[key],
                      trauma,
                      to(current[key][trauma]),
                    );
                    return separate
                      ? { ...current, [key]: next }
                      : { w: next, b: next };
                  })
                }
                onToggleLock={(trauma) =>
                  setLocked((current) => ({
                    ...current,
                    [key]: current[key].includes(trauma)
                      ? current[key].filter((t) => t !== trauma)
                      : [...current[key], trauma],
                  }))
                }
              />
            </div>
          ))}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {formula && (
            <PresetButton
              label='Balanced'
              description='By rating: the die leans toward the lower-rated player, more the further apart you are. Each player gets their own odds.'
              onClick={() => {
                setDraft(formula);
                setSeparate(true);
              }}
            />
          )}
          <PresetButton
            label='Default'
            description='A normal die for both: devastated 1 in 6, guilt 2 in 6, unaffected 2 in 6, psychopath 1 in 6.'
            onClick={() => both(DEFAULT_PERCENTS)}
          />
          <PresetButton
            label='Equal'
            description='Every outcome 25% for both players.'
            onClick={() => both(EQUAL_PERCENTS)}
          />
          <button
            type='button'
            className={cn(goldButton, buttonSm, 'ml-auto')}
            onClick={() => {
              const w = roundPercents(draft.w);
              onSave({ w, b: separate ? roundPercents(draft.b) : w });
            }}
          >
            Save odds
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SideDot = ({
  color,
  className,
}: {
  color: Color;
  className?: string;
}) => (
  <span
    className={cn(
      'size-3 flex-none rounded-full border-2 border-[#120d0b]',
      color === 'w' ? 'bg-[#f7f3ea]' : 'bg-[#2a2622]',
      className,
    )}
  />
);

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

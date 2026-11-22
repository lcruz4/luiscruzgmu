import { type ReactNode, useState } from 'react';
import { colorName, describeEvent, resultText } from '@/lib/remorse/describe';
import { cn } from '@/lib/utils';
import type { GameEvent, GameResponse } from '@/types/remorse';
import { Marker } from './Marker';
import type { GameCommand } from './useGame';

const btn =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 px-3.5 py-2 text-sm font-semibold disabled:cursor-default disabled:opacity-50';
const primary = cn(
  btn,
  'border-[#120d0b] bg-linear-to-b from-[#ffd27a] to-[#c98a1c] text-[#1a1209] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_#120d0b] hover:brightness-105',
);
const ghost = cn(
  btn,
  'border-[#514d47] bg-[#302d29] text-[#e8e4dc] hover:bg-[#3a3733]',
);
const danger = cn(
  btn,
  'border-[#120d0b] bg-linear-to-b from-[#e5484d] to-[#a3161b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_2px_0_#120d0b] hover:brightness-110',
);

const eventTone = (event: GameEvent) => {
  switch (event.type) {
    case 'move':
    case 'castle':
    case 'capture':
      return 'text-[#cfcbc3]';
    case 'death':
    case 'bloodlust':
    case 'check':
      return 'text-red-300';
    case 'heal':
      return 'text-sky-300';
    default:
      return 'text-[#ffd27a]';
  }
};

const Die = ({ value }: { value: number }) => (
  <i className='mr-1.5 inline-grid size-[18px] place-items-center rounded-[4px] border-2 border-[#120d0b] bg-[#f7f3ea] align-[-3px] text-[10px] font-bold text-[#120d0b] not-italic'>
    {value}
  </i>
);

// The panel's headline: whose move, or how it ended
const StatusCard = ({
  art,
  title,
  text,
  tone,
  children,
}: {
  art?: ReactNode;
  title: string;
  text?: string;
  tone: 'gold' | 'red' | 'plain';
  children?: ReactNode;
}) => (
  <div
    className={cn(
      'flex flex-col gap-3 rounded-xl border p-3.5',
      tone === 'gold' && 'border-[#c98a1c]/45 bg-[#c98a1c]/10',
      tone === 'red' && 'border-red-400/40 bg-red-950/40',
      tone === 'plain' && 'border-[#3a3733] bg-[#1d1b18]',
    )}
  >
    <div className='flex items-center gap-3'>
      {art}
      <div className='min-w-0'>
        <strong
          className={cn(
            'block text-lg leading-tight font-bold',
            tone === 'gold' ? 'text-[#ffd27a]' : 'text-white',
          )}
        >
          {title}
        </strong>
        {text && <span className='text-[13px] text-[#a29e96]'>{text}</span>}
      </div>
    </div>
    {children}
  </div>
);

interface GamePanelProps {
  game: GameResponse;
  // steps from here on are still animating on the board; showing them (or the
  // status they lead to) would give a dice roll away
  hiddenFrom: number | null;
  error: string | null;
  busy: boolean;
  onCommand: (command: GameCommand) => void;
  onFlip: () => void;
  onRematch: () => void;
  rematchPending: boolean;
}

export const GamePanel = ({
  game,
  hiddenFrom,
  error,
  busy,
  onCommand,
  onFlip,
  onRematch,
  rematchPending,
}: GamePanelProps) => {
  const [copied, setCopied] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const { state } = game;
  const online = game.mode === 'online';
  const seatOpen = online && (!game.whiteEmail || !game.blackEmail);
  const revealing = hiddenFrom !== null;
  const yourTurn = game.you.includes(state.turn) && !state.winner;
  const canResign =
    !revealing &&
    !state.winner &&
    game.you.length > 0 &&
    Boolean(game.whiteEmail && game.blackEmail);
  const steps = revealing ? game.steps.slice(0, hiddenFrom) : game.steps;
  const psychopath = revealing
    ? undefined
    : state.pieces.find((p) => p.id === state.extraMovePieceId);
  const opponentName = game.you.includes('w') ? game.blackName : game.whiteName;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const status = () => {
    if (revealing) {
      return (
        <StatusCard
          tone='plain'
          title='Playing out the move…'
          art={
            <span className='grid size-11 flex-none animate-pulse place-items-center rounded-lg border-2 border-[#120d0b] bg-[#f7f3ea] text-lg font-bold text-[#120d0b]'>
              ?
            </span>
          }
        />
      );
    }
    if (state.winner) {
      const won =
        online && game.you.length === 1 && state.winner === game.you[0];
      const lost =
        online &&
        game.you.length === 1 &&
        state.winner !== 'draw' &&
        state.winner !== game.you[0];
      return (
        <StatusCard
          tone={lost ? 'plain' : 'gold'}
          title={won ? 'You won' : lost ? 'You lost' : resultText(state.winner)}
          text={
            won || lost
              ? resultText(state.winner)
              : 'Every capture left a mark.'
          }
          art={
            <Marker
              trauma={lost ? 'devastated' : 'psychopath'}
              healed={false}
              turnsLeft={lost ? 1 : 0}
              kills={won ? 3 : 0}
              className='block h-[52px] w-[48px] flex-none'
            />
          }
        >
          {game.you.length > 0 && (
            <button
              type='button'
              className={primary}
              disabled={rematchPending}
              onClick={onRematch}
            >
              {game.rematchId ? 'Go to rematch' : 'Rematch, colors swapped'}
            </button>
          )}
        </StatusCard>
      );
    }
    if (seatOpen) {
      return game.you.length ? (
        <StatusCard
          tone='gold'
          title='Invite your opponent'
          text='Send them this game’s link. Colors were drawn at random.'
        >
          <button type='button' className={primary} onClick={copyInvite}>
            {copied ? 'Link copied' : 'Copy invite link'}
          </button>
        </StatusCard>
      ) : (
        <StatusCard tone='gold' title='A seat is open'>
          <button
            type='button'
            className={primary}
            disabled={busy}
            onClick={() => onCommand({ type: 'join' })}
          >
            Join as {game.whiteEmail ? 'black' : 'white'}
          </button>
        </StatusCard>
      );
    }
    if (psychopath) {
      return (
        <StatusCard
          tone='red'
          title={`${colorName(state.turn)}'s psychopath strikes again`}
          text={`The piece on ${psychopath.square} may make an extra move.`}
          art={
            <Marker
              trauma='psychopath'
              healed={false}
              turnsLeft={0}
              kills={psychopath.kills}
              className='block h-[52px] w-[48px] flex-none'
            />
          }
        >
          {yourTurn && (
            <button
              type='button'
              className={ghost}
              disabled={busy}
              onClick={() => onCommand({ type: 'skipExtraMove' })}
            >
              Skip extra move
            </button>
          )}
        </StatusCard>
      );
    }
    if (!online) {
      return (
        <StatusCard
          tone='gold'
          title={`${colorName(state.turn)} to move`}
          text='Pass the device across the table.'
        />
      );
    }
    return yourTurn ? (
      <StatusCard
        tone='gold'
        title='Your move'
        text='Drag a piece, or tap it and then its square.'
        art={
          <img
            src={`/images/${state.turn}k.png`}
            alt=''
            className='size-11 flex-none'
          />
        }
      />
    ) : (
      <StatusCard
        tone='plain'
        title={`Waiting for ${opponentName ?? 'your opponent'}`}
        text='Their move shows up here as soon as they play.'
      />
    );
  };

  return (
    <aside className='flex w-full flex-col gap-3.5 lg:w-[340px]'>
      {status()}

      {error && <p className='text-sm text-red-300'>{error}</p>}

      {canResign && confirmResign && (
        <StatusCard
          tone='red'
          title={
            online
              ? 'Resign this game?'
              : `Resign for ${colorName(state.turn).toLowerCase()}?`
          }
          text='It can’t be undone.'
        >
          <div className='flex gap-2'>
            <button
              type='button'
              className={danger}
              disabled={busy}
              onClick={() => {
                setConfirmResign(false);
                onCommand({ type: 'resign' });
              }}
            >
              Yes, resign
            </button>
            <button
              type='button'
              className={ghost}
              onClick={() => setConfirmResign(false)}
            >
              Keep playing
            </button>
          </div>
        </StatusCard>
      )}

      <div className='flex flex-wrap gap-2'>
        <button type='button' className={ghost} onClick={onFlip}>
          ⇅ Flip board
        </button>
        {canResign && !confirmResign && (
          <button
            type='button'
            className={ghost}
            disabled={busy}
            onClick={() => setConfirmResign(true)}
          >
            ⚑ Resign
          </button>
        )}
      </div>

      <section className='flex min-h-0 flex-col rounded-xl bg-[#262421] p-3.5'>
        <div className='mb-2 flex items-baseline justify-between'>
          <h2 className='font-semibold text-white'>Moves</h2>
          <span className='text-xs text-[#a29e96] tabular-nums'>
            {steps.length}
          </span>
        </div>
        {!steps.length && (
          <p className='text-[13px] text-[#a29e96]'>
            No moves yet. The first capture rolls the die.
          </p>
        )}
        <ol className='flex max-h-[45dvh] flex-col overflow-y-auto text-[13px] leading-snug'>
          {[...steps].reverse().map((step) => (
            <li
              key={step.step}
              className='flex gap-2.5 border-t border-[#3a3733] py-2 first:border-t-0'
            >
              <span
                className={cn(
                  'mt-[3px] inline-block size-2.5 flex-none rounded-full border',
                  step.color === 'w'
                    ? 'border-[#120d0b] bg-[#f7f3ea]'
                    : 'border-[#6b665e] bg-[#2b2724]',
                )}
              />
              <div className='min-w-0 flex-1'>
                {step.events.map((event, index) => (
                  <div key={index} className={eventTone(event)}>
                    {event.type === 'roll' && <Die value={event.roll} />}
                    {describeEvent(event)}
                  </div>
                ))}
              </div>
              <span className='flex-none text-xs text-[#6b665e] tabular-nums'>
                {step.step}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
};

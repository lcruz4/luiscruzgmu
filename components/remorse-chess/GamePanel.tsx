import { useState } from 'react';
import { colorName, describeEvent, resultText } from '@/lib/remorse/describe';
import { inCheck } from '@/lib/remorse/engine';
import { cn } from '@/lib/utils';
import type { GameEvent, GameResponse } from '@/types/remorse';
import type { GameCommand } from './useGame';

const button =
  'rounded-md border border-[#514d47] bg-[#3a3733] px-3 py-1.5 text-sm text-white hover:bg-[#4a4642] disabled:opacity-40';

const isNotable = (event: GameEvent) =>
  event.type !== 'move' && event.type !== 'capture';

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
  const seatOpen =
    game.mode === 'online' && (!game.whiteEmail || !game.blackEmail);
  const yourTurn = game.you.includes(state.turn) && !state.winner;
  const canResign =
    hiddenFrom === null &&
    !state.winner &&
    game.you.length > 0 &&
    Boolean(game.whiteEmail && game.blackEmail);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const revealing = hiddenFrom !== null;
  const steps = revealing ? game.steps.slice(0, hiddenFrom) : game.steps;
  const psychopath = revealing
    ? undefined
    : state.pieces.find((p) => p.id === state.extraMovePieceId);
  const status = revealing
    ? 'Playing out the move…'
    : state.winner
    ? resultText(state.winner)
    : psychopath
    ? `${colorName(state.turn)}'s psychopath on ${
        psychopath.square
      } may move again`
    : `${colorName(state.turn)} to move${
        inCheck(state, state.turn) ? ', in check' : ''
      }`;

  return (
    <aside className='flex w-full flex-col gap-4 rounded-xl bg-[#262421] p-4 lg:w-80'>
      <div className='flex flex-col gap-1 text-sm'>
        <span>
          <span className='mr-2 inline-block h-3 w-3 rounded-full border border-black bg-white align-middle' />
          {game.mode === 'local'
            ? 'You (both sides)'
            : game.whiteName ?? 'Waiting for a player'}
        </span>
        {game.mode === 'online' && (
          <span>
            <span className='mr-2 inline-block h-3 w-3 rounded-full border border-[#888] bg-black align-middle' />
            {game.blackName ?? 'Waiting for a player'}
          </span>
        )}
      </div>

      <div
        className={cn(
          'rounded-md px-3 py-2 text-sm font-medium',
          psychopath ? 'bg-red-900/60 text-red-100' : 'bg-[#3a3733] text-white',
          state.winner && !revealing && 'bg-amber-700/60',
        )}
      >
        {status}
        {yourTurn && !revealing && game.mode === 'online' && (
          <span className='ml-1 font-normal text-[#cfcbc3]'>· your turn</span>
        )}
      </div>

      {psychopath && yourTurn && (
        <button
          type='button'
          className={button}
          disabled={busy}
          onClick={() => onCommand({ type: 'skipExtraMove' })}
        >
          Skip extra move
        </button>
      )}

      {state.winner && !revealing && game.you.length > 0 && (
        <button
          type='button'
          className='cursor-pointer rounded-[10px] border-2 border-[#120d0b] bg-linear-to-b from-[#ffd27a] to-[#c98a1c] px-3 py-2 text-sm font-semibold text-[#1a1209] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_#120d0b] hover:brightness-105 disabled:opacity-50'
          disabled={rematchPending}
          onClick={onRematch}
        >
          {game.rematchId ? 'Go to rematch' : 'Rematch, colors swapped'}
        </button>
      )}

      {error && <p className='text-sm text-red-300'>{error}</p>}

      {canResign && confirmResign && (
        <div className='flex flex-col gap-2 rounded-md border border-red-400/40 bg-red-950/40 p-3 text-sm'>
          <span className='text-white'>
            {game.mode === 'local'
              ? `Resign for ${colorName(state.turn).toLowerCase()}?`
              : 'Resign this game?'}{' '}
            <span className='text-[#cfcbc3]'>It can&apos;t be undone.</span>
          </span>
          <div className='flex gap-2'>
            <button
              type='button'
              className='cursor-pointer rounded-md border border-red-400/60 bg-red-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40'
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
              className={button}
              onClick={() => setConfirmResign(false)}
            >
              Keep playing
            </button>
          </div>
        </div>
      )}

      <div className='flex flex-wrap gap-2'>
        {game.canUndo && (
          <button
            type='button'
            className={button}
            disabled={busy}
            onClick={() => onCommand({ type: 'undo' })}
            title='Take back the last move'
          >
            ↶ Undo last move
          </button>
        )}
        <button type='button' className={button} onClick={onFlip}>
          ⇅ Flip board
        </button>
        {canResign && !confirmResign && (
          <button
            type='button'
            className={button}
            disabled={busy}
            onClick={() => setConfirmResign(true)}
          >
            ⚑ Resign
          </button>
        )}
        {seatOpen && !game.you.length && (
          <button
            type='button'
            className={button}
            disabled={busy}
            onClick={() => onCommand({ type: 'join' })}
          >
            Join as {game.whiteEmail ? 'black' : 'white'}
          </button>
        )}
        {seatOpen && game.you.length > 0 && (
          <button type='button' className={button} onClick={copyInvite}>
            {copied ? 'Link copied' : 'Copy invite link'}
          </button>
        )}
      </div>

      <div className='flex flex-col text-sm'>
        <span className='mb-1 font-medium text-white'>Moves</span>
        {!steps.length && <span className='text-[#a29e96]'>No moves yet</span>}
        <ol className='flex max-h-[45dvh] flex-col overflow-y-auto'>
          {[...steps].reverse().map((step) => (
            <li key={step.step} className='border-t border-[#3a3733] py-1.5'>
              {step.events.map((event, index) => (
                <div
                  key={index}
                  className={cn(
                    isNotable(event) ? 'text-amber-200' : 'text-[#cfcbc3]',
                    index > 0 && 'pl-3',
                  )}
                >
                  {describeEvent(event)}
                </div>
              ))}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
};

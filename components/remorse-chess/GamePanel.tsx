import { useState } from 'react';
import { colorName, describeEvent } from '@/lib/remorse/describe';
import { cn } from '@/lib/utils';
import type { GameEvent, GameResponse } from '@/types/remorse';
import type { GameCommand } from './useGame';

const button =
  'rounded-md border border-[#514d47] bg-[#3a3733] px-3 py-1.5 text-sm text-white hover:bg-[#4a4642] disabled:opacity-40';

const isNotable = (event: GameEvent) =>
  event.type !== 'move' && event.type !== 'capture';

interface GamePanelProps {
  game: GameResponse;
  error: string | null;
  busy: boolean;
  onCommand: (command: GameCommand) => void;
  onFlip: () => void;
}

export const GamePanel = ({
  game,
  error,
  busy,
  onCommand,
  onFlip,
}: GamePanelProps) => {
  const [copied, setCopied] = useState(false);
  const { state } = game;
  const seatOpen =
    game.mode === 'online' && (!game.whiteEmail || !game.blackEmail);
  const yourTurn = game.you.includes(state.turn) && !state.winner;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const psychopath = state.pieces.find((p) => p.id === state.extraMovePieceId);
  const status = state.winner
    ? `${colorName(state.winner)} wins`
    : psychopath
    ? `${colorName(state.turn)}'s psychopath on ${
        psychopath.square
      } may move again`
    : `${colorName(state.turn)} to move`;

  return (
    <aside className='flex w-full flex-col gap-4 rounded-xl bg-[#262421] p-4 lg:w-80'>
      <div className='flex flex-col gap-1 text-sm'>
        <span>
          <span className='mr-2 inline-block h-3 w-3 rounded-full border border-black bg-white align-middle' />
          {game.mode === 'local'
            ? 'You (both sides)'
            : game.whiteEmail ?? 'Waiting for a player'}
        </span>
        {game.mode === 'online' && (
          <span>
            <span className='mr-2 inline-block h-3 w-3 rounded-full border border-[#888] bg-black align-middle' />
            {game.blackEmail ?? 'Waiting for a player'}
          </span>
        )}
      </div>

      <div
        className={cn(
          'rounded-md px-3 py-2 text-sm font-medium',
          psychopath ? 'bg-red-900/60 text-red-100' : 'bg-[#3a3733] text-white',
          state.winner && 'bg-amber-700/60',
        )}
      >
        {status}
        {yourTurn && !state.winner && game.mode === 'online' && (
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

      {error && <p className='text-sm text-red-300'>{error}</p>}

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
        {!game.steps.length && (
          <span className='text-[#a29e96]'>No moves yet</span>
        )}
        <ol className='flex max-h-[45dvh] flex-col overflow-y-auto'>
          {[...game.steps].reverse().map((step) => (
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

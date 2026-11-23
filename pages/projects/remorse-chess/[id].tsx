import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Board } from '@/components/remorse-chess/Board';
import { GamePanel } from '@/components/remorse-chess/GamePanel';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import { PlayerStrip } from '@/components/remorse-chess/PlayerStrip';
import { UsernamePrompt } from '@/components/remorse-chess/UsernamePrompt';
import {
  useCancelGame,
  useCreateGame,
  useGame,
} from '@/components/remorse-chess/useGame';
import { useBadgeSync } from '@/components/remorse-chess/useYourMoveAlerts';
import { inCheck, opponent } from '@/lib/remorse/engine';
import { requireLogin } from '@/services/auth';
import type { Color, GameResponse } from '@/types/remorse';

const lastMoveOf = (game: GameResponse) => {
  for (const event of game.steps.at(-1)?.events ?? []) {
    if (event.type === 'move') return { from: event.from, to: event.to };
  }
  return null;
};

const GamePage = ({ email }: { email: string }) => {
  const router = useRouter();
  const id =
    typeof router.query.id === 'string' ? Number(router.query.id) : undefined;
  const { query, mutation } = useGame(id);
  const rematch = useCreateGame();
  const cancel = useCancelGame();
  const [flip, setFlip] = useState(false);
  // steps from here on are still animating, so the panel holds them back
  const [hiddenFrom, setHiddenFrom] = useState<number | null>(null);
  const game = query.data;
  useBadgeSync(email, game?.version);

  if (!game) {
    return (
      <RemorseLayout>
        {query.isError ? (
          <p className='mx-auto max-w-[1060px] text-red-300'>
            {query.error.message}
          </p>
        ) : (
          <div className='mx-auto flex max-w-[1060px] flex-col items-center gap-5 pt-9 lg:flex-row lg:items-start lg:justify-center'>
            <div className='aspect-square w-full max-w-[min(640px,calc(100dvh-250px))] animate-pulse rounded-2xl bg-[#262421]' />
            <div className='h-40 w-full animate-pulse rounded-xl bg-[#262421] lg:w-[340px]' />
          </div>
        )}
      </RemorseLayout>
    );
  }

  // Black sits at the bottom for the black player
  const blackSeat = game.you.length === 1 && game.you[0] === 'b';
  const canMove =
    game.you.includes(game.state.turn) &&
    !game.state.winner &&
    !mutation.isPending;

  const flipped = blackSeat !== flip;
  const topColor = flipped ? 'w' : 'b';
  const settled = hiddenFrom === null && !game.state.winner;
  const toMove = (color: Color) => settled && game.state.turn === color;
  const check = settled && inCheck(game.state, game.state.turn);

  const yourMove =
    game.mode === 'online' &&
    hiddenFrom === null &&
    game.you.includes(game.state.turn) &&
    !game.state.winner;

  return (
    <RemorseLayout title={yourMove ? 'Your move · Remorse Chess' : undefined}>
      <UsernamePrompt />
      <div className='mx-auto flex max-w-[1060px] flex-col gap-4'>
        <Link
          href='/projects/remorse-chess'
          className='self-start text-sm text-[#a29e96] hover:text-white'
        >
          ← Your games
        </Link>
        <div className='flex flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center'>
          <div className='w-full max-w-[min(640px,calc(100dvh-250px))] min-w-[min(100%,320px)]'>
            <PlayerStrip
              game={game}
              color={topColor}
              toMove={toMove(topColor)}
              inCheck={check}
            />
            {/* Phones: the board runs edge to edge, past the page padding */}
            <div className='rounded-2xl border border-[#3a3733] bg-[#262421] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,.45)] max-sm:-mx-4 max-sm:rounded-none max-sm:border-0 max-sm:p-0 max-sm:shadow-none'>
              <Board
                state={game.state}
                steps={game.steps}
                onAnimating={setHiddenFrom}
                flipped={flipped}
                canMove={canMove}
                lastMove={lastMoveOf(game)}
                onMove={(from, to, promotion) =>
                  mutation.mutate({ type: 'move', from, to, promotion })
                }
                onSelfHeal={(piece) =>
                  mutation.mutate({ type: 'selfHeal', pieceId: piece.id })
                }
              />
            </div>
            <PlayerStrip
              game={game}
              color={opponent(topColor)}
              toMove={toMove(opponent(topColor))}
              inCheck={check}
            />
          </div>
          <GamePanel
            game={game}
            hiddenFrom={hiddenFrom}
            error={
              mutation.error?.message ??
              rematch.error?.message ??
              cancel.error?.message ??
              null
            }
            busy={mutation.isPending}
            onCommand={(command) => {
              mutation.mutate(command);
            }}
            onFlip={() => setFlip(!flip)}
            rematchPending={rematch.isPending}
            cancelPending={cancel.isPending}
            onCancel={() =>
              cancel.mutate(game.id, {
                onSuccess: () => router.push('/projects/remorse-chess'),
              })
            }
            onRematch={() =>
              rematch.mutate(
                { rematchOf: game.id },
                {
                  // A full load so the board doesn't animate between games
                  onSuccess: ({ id: next }) =>
                    window.location.assign(`/projects/remorse-chess/${next}`),
                },
              )
            }
          />
        </div>
      </div>
    </RemorseLayout>
  );
};

export const getServerSideProps = requireLogin('remorse-chess');

export default GamePage;

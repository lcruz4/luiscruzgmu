import { useRouter } from 'next/router';
import { useState } from 'react';
import { Board } from '@/components/remorse-chess/Board';
import { GamePanel } from '@/components/remorse-chess/GamePanel';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import { useCreateGame, useGame } from '@/components/remorse-chess/useGame';
import { requireLogin } from '@/services/auth';
import type { GameResponse } from '@/types/remorse';

const lastMoveOf = (game: GameResponse) => {
  for (const event of game.steps.at(-1)?.events ?? []) {
    if (event.type === 'move') return { from: event.from, to: event.to };
  }
  return null;
};

const GamePage = () => {
  const router = useRouter();
  const id =
    typeof router.query.id === 'string' ? Number(router.query.id) : undefined;
  const { query, mutation } = useGame(id);
  const rematch = useCreateGame();
  const [flip, setFlip] = useState(false);
  // steps from here on are still animating, so the panel holds them back
  const [hiddenFrom, setHiddenFrom] = useState<number | null>(null);
  const game = query.data;

  if (!game) {
    return (
      <RemorseLayout>
        <p className='text-[#a29e96]'>
          {query.isError ? query.error.message : 'Loading game…'}
        </p>
      </RemorseLayout>
    );
  }

  // Black sits at the bottom for the black player
  const blackSeat = game.you.length === 1 && game.you[0] === 'b';
  const canMove =
    game.you.includes(game.state.turn) &&
    !game.state.winner &&
    !mutation.isPending;

  const yourMove =
    game.mode === 'online' &&
    hiddenFrom === null &&
    game.you.includes(game.state.turn) &&
    !game.state.winner;

  return (
    <RemorseLayout title={yourMove ? 'Your move · Remorse Chess' : undefined}>
      <div className='flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center'>
        <Board
          state={game.state}
          steps={game.steps}
          onAnimating={setHiddenFrom}
          flipped={blackSeat !== flip}
          canMove={canMove}
          lastMove={lastMoveOf(game)}
          onMove={(from, to, promotion) =>
            mutation.mutate({ type: 'move', from, to, promotion })
          }
          onSelfHeal={(piece) =>
            mutation.mutate({ type: 'selfHeal', pieceId: piece.id })
          }
        />
        <GamePanel
          game={game}
          hiddenFrom={hiddenFrom}
          error={mutation.error?.message ?? rematch.error?.message ?? null}
          busy={mutation.isPending}
          onCommand={(command) => {
            mutation.mutate(command);
          }}
          onFlip={() => setFlip(!flip)}
          rematchPending={rematch.isPending}
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
    </RemorseLayout>
  );
};

export const getServerSideProps = requireLogin('remorse-chess');

export default GamePage;

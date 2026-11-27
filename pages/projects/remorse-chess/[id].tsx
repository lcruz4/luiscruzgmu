import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { BalanceSuggestionDialog } from '@/components/remorse-chess/Balance';
import { Board } from '@/components/remorse-chess/Board';
import { useClocks } from '@/components/remorse-chess/Clock';
import { GamePanel } from '@/components/remorse-chess/GamePanel';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import { PlayerStrip } from '@/components/remorse-chess/PlayerStrip';
import {
  RuleCallout,
  useNewRules,
} from '@/components/remorse-chess/RuleCallout';
import { RulesDialog } from '@/components/remorse-chess/RulesDialog';
import { UsernamePrompt } from '@/components/remorse-chess/UsernamePrompt';
import {
  useCancelGame,
  inlineError,
  useCreateGame,
  useGame,
  useMarkTutorialSeen,
  useProfile,
} from '@/components/remorse-chess/useGame';
import { useBadgeSync } from '@/components/remorse-chess/useYourMoveAlerts';
import { inCheck, opponent } from '@/lib/remorse/engine';
import { gamePath } from '@/lib/remorse/paths';
import { isLive } from '@/lib/remorse/timeControls';
import type { TutorialKey } from '@/lib/remorse/tutorial';
import { requireLogin } from '@/services/auth';
import type { Color, GameResponse } from '@/types/remorse';

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
  const invite =
    typeof router.query.invite === 'string' ? router.query.invite : null;
  const { query, mutation } = useGame(id);
  const rematch = useCreateGame();
  const cancel = useCancelGame();
  const [flip, setFlip] = useState(false);
  // steps from here on are still animating, so the panel holds them back
  const [hiddenFrom, setHiddenFrom] = useState<number | null>(null);
  const game = query.data;
  useBadgeSync(game?.version);
  const { mutate } = mutation;
  const flag = useCallback(() => mutate({ type: 'flag' }), [mutate]);
  const clocks = useClocks(game, flag);

  const profile = useProfile();
  const markSeen = useMarkTutorialSeen();
  const [rulesSlide, setRulesSlide] = useState<TutorialKey | null>(null);
  const newRules = useNewRules(game?.steps);
  const onAnimating = newRules.onAnimating;
  const handleAnimating = useCallback(
    (start: number | null) => {
      setHiddenFrom(start);
      onAnimating(start);
    },
    [onAnimating],
  );
  // Once seated, the invite has done its job; keep it out of the address bar
  const seated = Boolean(game?.you.length);
  useEffect(() => {
    if (!seated || !invite || id === undefined) return;
    router.replace(gamePath(id), undefined, { shallow: true });
  }, [seated, invite, id, router]);

  const seen = profile.data?.tutorialSeen;
  const callout = seen && newRules.found.find((rule) => !seen.includes(rule));

  // The rules open on a first game, once the name prompt is out of the way
  const needsIntro =
    profile.data?.chosen === true &&
    seen !== undefined &&
    !seen.includes('intro');
  useEffect(() => {
    if (!needsIntro) return;
    setRulesSlide('intro');
    markSeen(['intro']);
  }, [needsIntro, markSeen]);

  // Aborted or canceled while open here
  if (query.isError && query.error.message === 'Game not found') {
    return (
      <RemorseLayout>
        <div className='mx-auto flex max-w-[1060px] flex-col items-start gap-3 pt-9'>
          <p className='text-white'>This game was aborted.</p>
          <Link
            href='/projects/remorse-chess'
            className='text-[15px] font-semibold text-[#ffd27a] hover:underline'
          >
            Back to your games →
          </Link>
        </div>
      </RemorseLayout>
    );
  }

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
    Boolean(game.whiteEmail && game.blackEmail) &&
    hiddenFrom === null &&
    game.you.includes(game.state.turn) &&
    !game.state.winner;

  return (
    <RemorseLayout title={yourMove ? 'Your move · Remorse Chess' : undefined}>
      <UsernamePrompt />
      {hiddenFrom === null && (
        <BalanceSuggestionDialog suggestion={game.balanceSuggestion} />
      )}
      <RulesDialog
        slide={rulesSlide}
        onSlide={setRulesSlide}
        onClose={() => setRulesSlide(null)}
      />
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
              clock={clocks[topColor]}
            />
            {/* Phones: the board runs edge to edge, past the page padding */}
            <div className='rounded-2xl border border-[#3a3733] bg-[#262421] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,.45)] max-sm:-mx-4 max-sm:rounded-none max-sm:border-0 max-sm:p-0 max-sm:shadow-none'>
              <Board
                state={game.state}
                steps={game.steps}
                onAnimating={handleAnimating}
                flipped={flipped}
                canMove={canMove}
                premoveColor={
                  game.mode === 'online' && game.you.length === 1
                    ? game.you[0]
                    : null
                }
                dice={!isLive(game.timeControl)}
                lastMove={lastMoveOf(game)}
                onMove={(from, to, promotion) =>
                  mutation.mutate({ type: 'move', from, to, promotion })
                }
                onBishopHeal={(piece) =>
                  mutation.mutate({ type: 'bishopHeal', pieceId: piece.id })
                }
              />
            </div>
            {callout && (
              <RuleCallout
                rule={callout}
                onDismiss={() => markSeen([callout])}
                onMore={() => {
                  markSeen([callout]);
                  setRulesSlide(callout);
                }}
              />
            )}
            <PlayerStrip
              game={game}
              color={opponent(topColor)}
              toMove={toMove(opponent(topColor))}
              inCheck={check}
              clock={clocks[opponent(topColor)]}
            />
          </div>
          <GamePanel
            game={game}
            hiddenFrom={hiddenFrom}
            error={
              inlineError(mutation.error) ??
              inlineError(rematch.error) ??
              cancel.error?.message ??
              null
            }
            busy={mutation.isPending}
            onCommand={(command) => {
              mutation.mutate(command);
            }}
            onFlip={() => setFlip(!flip)}
            onRules={setRulesSlide}
            rematchPending={rematch.isPending}
            cancelPending={cancel.isPending}
            invite={invite}
            onCancel={() =>
              cancel.mutate(game.id, {
                onSuccess: () => router.push('/projects/remorse-chess'),
              })
            }
            onRematch={(balanced) =>
              rematch.mutate(
                { rematchOf: game.id, balanced },
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

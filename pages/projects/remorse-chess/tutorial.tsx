import Link from 'next/link';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Board } from '@/components/remorse-chess/Board';
import {
  buttonSm,
  ghostButton,
  goldButton,
} from '@/components/remorse-chess/buttons';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import { useMarkTutorialSeen } from '@/components/remorse-chess/useGame';
import { applyAction } from '@/lib/remorse/engine';
import { TUTORIAL, tutorialStart } from '@/lib/remorse/tutorialScript';
import { cn } from '@/lib/utils';
import { requireLogin } from '@/services/auth';
import type { Action, Color, GameState, GameStep } from '@/types/remorse';

const primary = cn(goldButton, buttonSm);
const ghost = cn(ghostButton, buttonSm);

const played = (
  state: GameState,
  steps: GameStep[],
  color: Color,
  action: Action,
  roll?: number,
) => {
  // The script test checks every first capture has its roll
  const { state: next, events } = applyAction(state, action, () => roll ?? 1);
  const step: GameStep = {
    step: steps.length + 1,
    color,
    events,
    createdAt: new Date().toISOString(),
  };
  return { state: next, steps: [...steps, step] };
};

const lastMoveOf = (steps: GameStep[]) => {
  for (const event of steps.at(-1)?.events ?? []) {
    if (event.type === 'move') return { from: event.from, to: event.to };
  }
  return null;
};

const Coach = ({
  title,
  text,
  progress,
  children,
}: {
  title: string;
  text: string;
  progress: number;
  children?: ReactNode;
}) => (
  <div className='flex w-full flex-col gap-3 rounded-xl border border-[#c98a1c]/45 bg-[#c98a1c]/10 p-4 lg:w-[340px]'>
    <div className='h-1 overflow-hidden rounded-full bg-[#3a3733]'>
      <div
        className='h-full bg-[#ffd27a] transition-[width] duration-500'
        style={{ width: `${progress * 100}%` }}
      />
    </div>
    <strong className='text-lg leading-tight text-[#ffd27a]'>{title}</strong>
    <p className='text-[14.5px] leading-snug text-[#e8e6e1]'>{text}</p>
    {children}
  </div>
);

// One run of the script; remounted to start over
const Tutorial = ({ onRestart }: { onRestart: () => void }) => {
  const [game, setGame] = useState(() => ({
    state: tutorialStart(),
    steps: [] as GameStep[],
  }));
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const markSeen = useMarkTutorialSeen();
  const onAnimating = useCallback(
    (start: number | null) => setAnimating(start !== null),
    [],
  );
  const beat = index < TUTORIAL.length ? TUTORIAL[index] : null;
  const done = beat === null;

  // Black replies on its own once the board is still
  useEffect(() => {
    if (beat?.kind !== 'them' || animating) return;
    const timer = setTimeout(() => {
      const { from, to, roll } = beat;
      setGame(
        played(game.state, game.steps, 'b', { type: 'move', from, to }, roll),
      );
      setIndex(index + 1);
    }, 700);
    return () => clearTimeout(timer);
  }, [beat, animating, game, index]);

  // Finishing it covers what the first-game rules dialog would explain
  useEffect(() => {
    if (done) markSeen(['intro']);
  }, [done, markSeen]);

  const progress = Math.min(index / TUTORIAL.length, 1);
  const yourMove = beat?.kind === 'you' && !animating;

  const coach = done ? (
    <Coach
      title="You're ready"
      text='Start a game with a friend, or pass one device back and forth.'
      progress={1}
    >
      <div className='flex flex-wrap gap-2'>
        <Link href='/projects/remorse-chess' className={primary}>
          Start a game
        </Link>
        <button type='button' className={ghost} onClick={onRestart}>
          Play it again
        </button>
      </div>
    </Coach>
  ) : animating || beat.kind === 'them' ? (
    <Coach title='Watch the board' text='…' progress={progress} />
  ) : beat.kind === 'note' ? (
    <Coach title={beat.title} text={beat.text} progress={progress}>
      <button
        type='button'
        className={cn(primary, 'self-start')}
        onClick={() => setIndex(index + 1)}
        autoFocus
      >
        Continue
      </button>
    </Coach>
  ) : (
    <Coach title='Your move' text={beat.text} progress={progress} />
  );

  return (
    <div className='mx-auto flex max-w-[1060px] flex-col gap-4'>
      <Link
        href='/projects/remorse-chess'
        className='self-start text-sm text-[#a29e96] hover:text-white'
      >
        ← Your games
      </Link>
      <div className='flex flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center'>
        <div className='w-full max-w-[min(640px,calc(100dvh-250px))] min-w-[min(100%,320px)]'>
          <div className='rounded-2xl border border-[#3a3733] bg-[#262421] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,.45)] max-sm:-mx-4 max-sm:rounded-none max-sm:border-0 max-sm:p-0 max-sm:shadow-none'>
            <Board
              state={game.state}
              steps={game.steps}
              onAnimating={onAnimating}
              flipped={false}
              canMove={yourMove}
              lastMove={lastMoveOf(game.steps)}
              guide={
                beat?.kind !== 'you'
                  ? null
                  : 'heal' in beat
                  ? { from: beat.heal }
                  : beat
              }
              onMove={(from, to) => {
                if (beat?.kind !== 'you' || 'heal' in beat) return;
                if (from !== beat.from || to !== beat.to) return;
                const action: Action = { type: 'move', from, to };
                setGame(played(game.state, game.steps, 'w', action, beat.roll));
                setIndex(index + 1);
              }}
              onBishopHeal={(piece) => {
                if (beat?.kind !== 'you' || !('heal' in beat)) return;
                if (piece.square !== beat.heal) return;
                const action: Action = {
                  type: 'bishopHeal',
                  pieceId: piece.id,
                };
                setGame(played(game.state, game.steps, 'w', action));
                setIndex(index + 1);
              }}
            />
          </div>
        </div>
        {coach}
      </div>
    </div>
  );
};

const TutorialPage = () => {
  const [run, setRun] = useState(0);
  return (
    <RemorseLayout title='Tutorial · Remorse Chess'>
      <Tutorial key={run} onRestart={() => setRun(run + 1)} />
    </RemorseLayout>
  );
};

export const getServerSideProps = requireLogin('remorse-chess');

export default TutorialPage;

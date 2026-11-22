import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { Marker } from '@/components/remorse-chess/Marker';
import type { MarkerProps } from '@/components/remorse-chess/markerSvg';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import { useCreateGame, useGames } from '@/components/remorse-chess/useGame';
import { colorName, resultText } from '@/lib/remorse/describe';
import { cn } from '@/lib/utils';
import { requireLogin } from '@/services/auth';
import type { Color, GameSummary } from '@/types/remorse';

const btn =
  'inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border-2 px-4 py-2.5 text-[15px] font-semibold disabled:cursor-default disabled:opacity-50';
const primary = cn(
  btn,
  'border-[#120d0b] bg-linear-to-b from-[#ffd27a] to-[#c98a1c] text-[#1a1209] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_#120d0b] hover:brightness-105',
);
const ghost = cn(
  btn,
  'border-[#514d47] bg-[#302d29] text-[#e8e4dc] hover:bg-[#3a3733]',
);
const h2 = 'mb-3 text-xl font-bold text-white';
const muted = 'text-[13.5px] text-[#a29e96]';

type Status = { label: string; tone: 'gold' | 'plain' | 'dim' };

const seatOf = (game: GameSummary, email: string): Color =>
  game.whiteEmail === email ? 'w' : 'b';

const opponentOf = (game: GameSummary, email: string) => {
  if (game.mode === 'local') return 'Pass and play';
  const other = game.whiteEmail === email ? game.blackEmail : game.whiteEmail;
  return other ? `vs ${other.split('@')[0]}` : 'Waiting for an opponent';
};

const statusOf = (game: GameSummary, email: string): Status => {
  if (game.mode === 'local') {
    return game.winner
      ? { label: resultText(game.winner), tone: 'dim' }
      : { label: `${colorName(game.turn)} to move`, tone: 'gold' };
  }
  const seat = seatOf(game, email);
  if (game.winner) {
    if (game.winner === 'draw') return { label: 'Draw', tone: 'dim' };
    return {
      label: game.winner === seat ? 'You won' : 'You lost',
      tone: 'dim',
    };
  }
  if (!game.whiteEmail || !game.blackEmail) {
    return { label: 'Invite pending', tone: 'plain' };
  }
  return game.turn === seat
    ? { label: 'Your move', tone: 'gold' }
    : { label: 'Their move', tone: 'plain' };
};

const ago = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];
const timeAgo = (iso: string) => {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return ago.format(Math.round(seconds / size), unit);
    }
  }
  return 'just now';
};

// Your seat as a little piece-colored disc; half and half for local games
const SeatDisc = ({ game, email }: { game: GameSummary; email: string }) => {
  const ring = 'size-9 flex-none rounded-full border-2 border-[#120d0b]';
  if (game.mode === 'local') {
    return (
      <span
        className={cn(
          ring,
          'bg-linear-to-r from-[#f7f3ea] from-50% to-[#2b2724] to-50%',
        )}
        title='Both sides'
      />
    );
  }
  const seat = seatOf(game, email);
  return (
    <span
      className={cn(
        ring,
        seat === 'w' ? 'bg-[#f7f3ea]' : 'bg-[#2b2724] border-[#6b665e]',
      )}
      title={`You play ${colorName(seat).toLowerCase()}`}
    />
  );
};

const Chip = ({ label, tone }: Status) => (
  <span
    className={cn(
      'flex-none rounded-full border px-2.5 py-0.5 text-xs font-semibold',
      tone === 'gold' && 'border-[#c98a1c]/45 bg-[#c98a1c]/15 text-[#ffd27a]',
      tone === 'plain' && 'border-[#514d47] bg-[#302d29] text-[#e8e4dc]',
      tone === 'dim' && 'border-[#3a3733] text-[#a29e96]',
    )}
  >
    {label}
  </span>
);

const GameRow = ({ game, email }: { game: GameSummary; email: string }) => {
  const status = statusOf(game, email);
  return (
    <Link
      href={`/projects/remorse-chess/${game.id}`}
      className={cn(
        'flex items-center gap-3 rounded-xl bg-[#262421] px-4 py-3 transition-colors hover:bg-[#302d29]',
        status.tone === 'gold' && 'ring-1 ring-[#c98a1c]/45',
      )}
    >
      <SeatDisc game={game} email={email} />
      <div className='min-w-0 flex-1'>
        <strong className='block truncate font-semibold text-white'>
          {opponentOf(game, email)}
        </strong>
        <span className={cn(muted, 'tabular-nums')}>
          Game #{game.id} · {timeAgo(game.updatedAt)}
        </span>
      </div>
      <Chip {...status} />
    </Link>
  );
};

const ModeCard = ({
  marker,
  title,
  text,
  children,
}: {
  marker: MarkerProps;
  title: string;
  text: string;
  children: ReactNode;
}) => (
  <div className='flex flex-col gap-3 rounded-xl bg-[#262421] p-4'>
    <div className='flex items-start gap-3'>
      <Marker {...marker} className='block h-[62px] w-[58px] flex-none' />
      <div>
        <h3 className='font-semibold text-white'>{title}</h3>
        <p className={muted}>{text}</p>
      </div>
    </div>
    <div className='mt-auto flex'>{children}</div>
  </div>
);

const LobbyPage = ({ email }: { email: string }) => {
  const router = useRouter();
  const games = useGames();
  const create = useCreateGame();

  const start = (mode: 'online' | 'local') =>
    create.mutate(
      { mode },
      { onSuccess: ({ id }) => router.push(`/projects/remorse-chess/${id}`) },
    );

  const list = games.data ?? [];
  // Games waiting on you float to the top
  const active = list
    .filter((game) => !game.winner)
    .sort(
      (a, b) =>
        Number(statusOf(b, email).tone === 'gold') -
        Number(statusOf(a, email).tone === 'gold'),
    );
  const finished = list.filter((game) => game.winner);
  const yourMove = active.filter(
    (game) => statusOf(game, email).tone === 'gold',
  ).length;

  return (
    <RemorseLayout>
      <div className='mx-auto flex max-w-[720px] flex-col gap-9 pt-3 text-[15px] leading-relaxed'>
        <section>
          <h1 className='mb-1 text-[clamp(24px,4vw,30px)] font-bold tracking-tight text-white'>
            {yourMove > 0
              ? `${yourMove} ${
                  yourMove === 1 ? 'game is' : 'games are'
                } waiting on you`
              : 'Start a game'}
          </h1>
          <p className='mb-5 text-[#a29e96]'>
            Colors are drawn at random. Every first capture rolls the die.
          </p>
          <div className='grid gap-3.5 sm:grid-cols-2'>
            <ModeCard
              marker={{
                trauma: 'psychopath',
                healed: false,
                turnsLeft: 0,
                kills: 0,
              }}
              title='Play a friend'
              text='Get an invite link to send. They join from any device.'
            >
              <button
                type='button'
                className={primary}
                disabled={create.isPending}
                onClick={() => start('online')}
              >
                Start online game
              </button>
            </ModeCard>
            <ModeCard
              marker={{
                trauma: 'guilt',
                healed: false,
                turnsLeft: 0,
                kills: 0,
              }}
              title='Pass and play'
              text='Both sides on one device. Good for a table and a friend.'
            >
              <button
                type='button'
                className={ghost}
                disabled={create.isPending}
                onClick={() => start('local')}
              >
                Start local game
              </button>
            </ModeCard>
          </div>
          {create.isError && (
            <p className='mt-3 text-sm text-red-300'>{create.error.message}</p>
          )}
        </section>

        {games.isError && (
          <p className='text-sm text-red-300'>{games.error.message}</p>
        )}

        {games.isPending && (
          <div className='flex flex-col gap-2'>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className='h-[62px] animate-pulse rounded-xl bg-[#262421]'
              />
            ))}
          </div>
        )}

        {games.isSuccess && list.length === 0 && (
          <section className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#3a3733] px-4 py-8 text-center'>
            <Marker
              trauma='devastated'
              healed={false}
              turnsLeft={3}
              kills={0}
              className='block h-[62px] w-[58px]'
            />
            <strong className='text-white'>No games yet</strong>
            <p className={muted}>
              Start one above. Your pieces are already nervous.
            </p>
          </section>
        )}

        {active.length > 0 && (
          <section>
            <h2 className={h2}>In progress</h2>
            <div className='flex flex-col gap-2'>
              {active.map((game) => (
                <GameRow key={game.id} game={game} email={email} />
              ))}
            </div>
          </section>
        )}

        {finished.length > 0 && (
          <section>
            <h2 className={h2}>Finished</h2>
            <div className='flex flex-col gap-2 opacity-80'>
              {finished.map((game) => (
                <GameRow key={game.id} game={game} email={email} />
              ))}
            </div>
          </section>
        )}
      </div>
    </RemorseLayout>
  );
};

export const getServerSideProps = requireLogin('remorse-chess');

export default LobbyPage;

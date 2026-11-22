import Link from 'next/link';
import { useRouter } from 'next/router';
import { type ReactNode, useMemo, useState } from 'react';
import { Marker } from '@/components/remorse-chess/Marker';
import type { MarkerProps } from '@/components/remorse-chess/markerSvg';
import { MiniBoard } from '@/components/remorse-chess/MiniBoard';
import { PlayerAvatar } from '@/components/remorse-chess/PlayerAvatar';
import { RecordCard } from '@/components/remorse-chess/RecordCard';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import { UsernamePrompt } from '@/components/remorse-chess/UsernamePrompt';
import {
  useArchive,
  useCreateGame,
  useGames,
  useProfile,
  useStats,
} from '@/components/remorse-chess/useGame';
import { useYourMoveAlerts } from '@/components/remorse-chess/useYourMoveAlerts';
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
const small =
  'cursor-pointer rounded-lg border border-[#514d47] bg-[#302d29] px-2.5 py-1 text-xs font-semibold text-[#e8e4dc] hover:bg-[#3a3733] disabled:cursor-default disabled:opacity-50';
const h2 = 'mb-3 text-xl font-bold text-white';
const muted = 'text-[13.5px] text-[#a29e96]';

type Status = { label: string; tone: 'gold' | 'plain' | 'dim' };

const seatOf = (game: GameSummary, email: string): Color =>
  game.whiteEmail === email ? 'w' : 'b';

const opponentOf = (game: GameSummary, email: string) => {
  if (game.mode === 'local') return 'Pass and play';
  const other = game.whiteEmail === email ? game.blackName : game.whiteName;
  return other ? `vs ${other}` : 'Waiting for an opponent';
};

const inviteOpen = (game: GameSummary) =>
  game.mode === 'online' && (!game.whiteEmail || !game.blackEmail);

// Gold is kept for online games waiting on you
const statusOf = (game: GameSummary, email: string): Status => {
  if (game.mode === 'local') {
    return game.winner
      ? { label: resultText(game.winner), tone: 'dim' }
      : { label: `${colorName(game.turn)} to move`, tone: 'plain' };
  }
  const seat = seatOf(game, email);
  if (game.winner) {
    if (game.winner === 'draw') return { label: 'Draw', tone: 'dim' };
    return {
      label: game.winner === seat ? 'You won' : 'You lost',
      tone: 'dim',
    };
  }
  if (inviteOpen(game)) return { label: 'Invite pending', tone: 'plain' };
  return game.turn === seat
    ? { label: 'Your move', tone: 'gold' }
    : { label: 'Their move', tone: 'plain' };
};

const isYourMove = (game: GameSummary, email: string) =>
  statusOf(game, email).tone === 'gold';

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

const gamePath = (id: number) => `/projects/remorse-chess/${id}`;

const CopyInvite = ({ id }: { id: number }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${gamePath(id)}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type='button' className={small} onClick={copy}>
      {copied ? 'Link copied' : 'Copy invite link'}
    </button>
  );
};

const GameRow = ({
  game,
  email,
  onRematch,
  rematchBusy,
}: {
  game: GameSummary;
  email: string;
  onRematch: (id: number) => void;
  rematchBusy: boolean;
}) => {
  const archive = useArchive();
  const status = statusOf(game, email);
  const seat = seatOf(game, email);
  const flipped = game.mode === 'online' && seat === 'b';
  const detail = [
    game.mode === 'online' && `You play ${colorName(seat).toLowerCase()}`,
    timeAgo(game.updatedAt),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-[#262421] p-2.5 pr-3 transition-colors hover:bg-[#2c2a26]',
        status.tone === 'gold' && 'ring-1 ring-[#c98a1c]/45',
        game.archived && 'opacity-70',
      )}
    >
      <Link
        href={gamePath(game.id)}
        className='flex min-w-0 flex-[1_1_320px] items-center gap-3'
      >
        <MiniBoard pieces={game.pieces} flipped={flipped} />
        <div className='min-w-0 flex-1'>
          <strong className='flex min-w-0 items-center gap-1.5 font-semibold text-white'>
            {game.mode === 'online' && !inviteOpen(game) && (
              <PlayerAvatar
                icon={seat === 'w' ? game.blackIcon : game.whiteIcon}
                className='size-6'
              />
            )}
            <span className='truncate'>{opponentOf(game, email)}</span>
          </strong>
          <span className={cn(muted, 'block truncate')}>{detail}</span>
        </div>
        {!inviteOpen(game) && <Chip {...status} />}
      </Link>
      {(inviteOpen(game) || game.winner) && (
        <div className='ml-auto flex gap-2'>
          {inviteOpen(game) && <CopyInvite id={game.id} />}
          {game.winner &&
            (game.rematchId ? (
              <Link href={gamePath(game.rematchId)} className={small}>
                Go to rematch
              </Link>
            ) : (
              !inviteOpen(game) && (
                <button
                  type='button'
                  className={small}
                  disabled={rematchBusy}
                  onClick={() => onRematch(game.id)}
                >
                  Rematch
                </button>
              )
            ))}
          {game.winner && (
            <button
              type='button'
              className={small}
              disabled={archive.isPending}
              onClick={() =>
                archive.mutate({ id: game.id, archived: !game.archived })
              }
            >
              {game.archived ? 'Restore' : 'Archive'}
            </button>
          )}
        </div>
      )}
    </div>
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
  const stats = useStats();
  const profile = useProfile();
  const create = useCreateGame();
  const [showArchived, setShowArchived] = useState(false);

  const open = ({ id }: { id: number }) => router.push(gamePath(id));
  const start = (mode: 'online' | 'local') =>
    create.mutate({ mode }, { onSuccess: open });
  const rematch = (id: number) =>
    create.mutate({ rematchOf: id }, { onSuccess: open });

  const list = useMemo(() => games.data ?? [], [games.data]);
  const visible = list.filter((game) => !game.archived);
  const archived = list.filter((game) => game.archived);
  // Games waiting on you float to the top
  const active = visible
    .filter((game) => !game.winner)
    .sort(
      (a, b) => Number(isYourMove(b, email)) - Number(isYourMove(a, email)),
    );
  const finished = visible.filter((game) => game.winner);

  const alerts = useMemo(
    () =>
      games.data
        ?.filter((game) => isYourMove(game, email))
        .map((game) => ({
          id: game.id,
          text: `Your move ${opponentOf(game, email)}`,
        })),
    [games.data, email],
  );
  const notify = useYourMoveAlerts(alerts);
  const yourMove = alerts?.length ?? 0;

  const row = (game: GameSummary) => (
    <GameRow
      key={game.id}
      game={game}
      email={email}
      onRematch={rematch}
      rematchBusy={create.isPending}
    />
  );

  return (
    <RemorseLayout>
      <UsernamePrompt />
      <div className='mx-auto flex max-w-[760px] flex-col gap-9 pt-3 text-[15px] leading-relaxed'>
        <section>
          <div className='mb-6 flex flex-wrap items-center gap-x-3 gap-y-2'>
            {profile.data && (
              <PlayerAvatar
                icon={profile.data.icon}
                className='size-12 border-[3px]'
              />
            )}
            <h1 className='text-[clamp(26px,4.5vw,34px)] leading-tight font-bold tracking-tight text-white'>
              {profile.data?.username ?? (
                <span className='inline-block h-8 w-40 animate-pulse rounded-md bg-[#262421] align-middle' />
              )}
            </h1>
            <Link
              href='/projects/remorse-chess/profile'
              className='text-sm text-[#a29e96] hover:text-white'
              aria-label='Edit your username'
            >
              ✎ Edit
            </Link>
          </div>
          <h2 className={h2}>New game</h2>
          {notify.permission === 'default' && (
            <button
              type='button'
              className='mb-4 cursor-pointer text-[15px] font-semibold text-[#ffd27a]'
              onClick={notify.enable}
            >
              Notify me when it&apos;s my move →
            </button>
          )}
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
                className='h-[76px] animate-pulse rounded-xl bg-[#262421]'
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
            <h2 className={cn(h2, 'flex items-center gap-2')}>
              In progress
              {yourMove > 0 && (
                <span
                  className='grid h-6 min-w-6 place-items-center rounded-full bg-[#c62828] px-1.5 text-xs font-bold text-white tabular-nums shadow-[0_1px_0_#120d0b]'
                  title={`${yourMove} waiting on your move`}
                  aria-label={`${yourMove} waiting on your move`}
                >
                  {yourMove}
                </span>
              )}
            </h2>
            <div className='flex flex-col gap-2'>{active.map(row)}</div>
          </section>
        )}

        {finished.length > 0 && (
          <section>
            <h2 className={h2}>Finished</h2>
            <div className='flex flex-col gap-2'>{finished.map(row)}</div>
          </section>
        )}

        {archived.length > 0 && (
          <section>
            <button
              type='button'
              className='cursor-pointer text-sm font-semibold text-[#a29e96] hover:text-white'
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? '▾' : '▸'} Archived ({archived.length})
            </button>
            {showArchived && (
              <div className='mt-3 flex flex-col gap-2'>
                {archived.map(row)}
              </div>
            )}
          </section>
        )}

        {stats.data && (
          <section>
            <h2 className={h2}>Your record</h2>
            <RecordCard stats={stats.data} />
          </section>
        )}
      </div>
    </RemorseLayout>
  );
};

export const getServerSideProps = requireLogin('remorse-chess');

export default LobbyPage;

import Link from 'next/link';
import { useRouter } from 'next/router';
import { type ReactNode, useMemo, useState } from 'react';
import { Marker } from '@/components/remorse-chess/Marker';
import {
  BoardIcon,
  DieIcon,
  LetterIcon,
  SwordsIcon,
} from '@/components/remorse-chess/ModeIcons';
import {
  PlayerLink,
  stretchedLink,
} from '@/components/remorse-chess/PlayerLink';
import { MiniBoard } from '@/components/remorse-chess/MiniBoard';
import { PlayerAvatar } from '@/components/remorse-chess/PlayerAvatar';
import { RecordCard } from '@/components/remorse-chess/RecordCard';
import {
  DefaultActions,
  RemorseLayout,
} from '@/components/remorse-chess/RemorseLayout';
import { UsernamePrompt } from '@/components/remorse-chess/UsernamePrompt';
import {
  useAcceptChallenge,
  useArchive,
  useCancelGame,
  useCreateGame,
  useFollowing,
  useGames,
  useProfile,
  useStats,
} from '@/components/remorse-chess/useGame';
import { useYourMoveAlerts } from '@/components/remorse-chess/useYourMoveAlerts';
import { colorName, resultText } from '@/lib/remorse/describe';
import { gamePath, inviteUrl } from '@/lib/remorse/paths';
import { cn } from '@/lib/utils';
import {
  buttonMd,
  ghostButton,
  goldButton,
} from '@/components/remorse-chess/buttons';
import { requireLogin } from '@/services/auth';
import type { PlayerIcon } from '@/lib/remorse/icons';
import type { Color, GameSummary } from '@/types/remorse';

const primary = cn(goldButton, buttonMd);
const ghost = cn(ghostButton, buttonMd);
const small =
  'cursor-pointer rounded-lg border border-[#514d47] bg-[#302d29] px-2.5 py-1 text-xs font-semibold text-[#e8e4dc] hover:bg-[#3a3733] disabled:cursor-default disabled:opacity-50';
const h2 = 'mb-3 text-xl font-bold text-white';
const muted = 'text-[13.5px] text-[#a29e96]';

type Status = { label: string; tone: 'gold' | 'plain' | 'dim' };

// A challenged player's seat is the open one
const seatOf = (game: GameSummary, email: string): Color => {
  if (game.whiteEmail === email) return 'w';
  if (game.blackEmail === email) return 'b';
  return game.whiteEmail ? 'b' : 'w';
};

// The other side: who you play, or who challenged you
const opponent = (
  game: GameSummary,
  email: string,
): { id: number | null; name: string; icon: PlayerIcon | null } | null => {
  if (game.challenge && !game.challenge.you) {
    const { playerId, name, icon } = game.challenge;
    return { id: playerId, name, icon };
  }
  const white = seatOf(game, email) === 'b';
  const name = white ? game.whiteName : game.blackName;
  if (!name) return null;
  return {
    id: white ? game.whiteId : game.blackId,
    name,
    icon: white ? game.whiteIcon : game.blackIcon,
  };
};

const opponentOf = (game: GameSummary, email: string) => {
  if (game.mode === 'local') return 'Pass and play';
  const other = opponent(game, email);
  if (game.challenge?.you) return `${other?.name} challenged you`;
  if (game.challenge) return `Challenged ${other?.name}`;
  if (other) return `vs ${other.name}`;
  return game.matchmaking
    ? 'Finding a random opponent'
    : 'Waiting for a friend';
};

const OpponentLabel = ({
  game,
  email,
}: {
  game: GameSummary;
  email: string;
}) => {
  const other = opponent(game, email);
  if (game.mode === 'local' || !other) return <>{opponentOf(game, email)}</>;
  const name = (
    <PlayerLink id={other.id} className='truncate'>
      {other.name}
    </PlayerLink>
  );
  return (
    <>
      <PlayerAvatar icon={other.icon} className='size-6' />
      {game.challenge?.you ? (
        <>
          {name}
          <span className='flex-none font-normal'>challenged you</span>
        </>
      ) : (
        <>
          <span className='flex-none font-normal text-[#a29e96]'>
            {game.challenge ? 'Challenged' : 'vs'}
          </span>
          {name}
        </>
      )}
    </>
  );
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
  if (game.challenge?.you) return { label: 'Your call', tone: 'gold' };
  if (inviteOpen(game)) {
    return {
      label: game.matchmaking
        ? 'Looking'
        : game.challenge
        ? 'Challenge sent'
        : 'Invite pending',
      tone: 'plain',
    };
  }
  return game.yourMove
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

const CopyInvite = ({ id, token }: { id: number; token: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl(id, token));
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

const AnswerChallenge = ({ id }: { id: number }) => {
  const router = useRouter();
  const accept = useAcceptChallenge();
  const decline = useCancelGame();
  const error = accept.error ?? decline.error;
  return (
    <>
      {error && (
        <span className='self-center text-xs text-red-300'>
          {error.message}
        </span>
      )}
      <button
        type='button'
        className={cn(
          small,
          'border-[#c98a1c]/60 bg-[#c98a1c]/20 text-[#ffd27a] hover:bg-[#c98a1c]/30',
        )}
        disabled={accept.isPending || decline.isPending}
        onClick={() =>
          accept.mutate(id, { onSuccess: () => router.push(gamePath(id)) })
        }
      >
        Accept
      </button>
      <button
        type='button'
        className={small}
        disabled={accept.isPending || decline.isPending}
        onClick={() => decline.mutate(id)}
      >
        Decline
      </button>
    </>
  );
};

const CancelInvite = ({ id, label }: { id: number; label: string }) => {
  const cancel = useCancelGame();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type='button'
        className={small}
        onClick={() => setConfirming(true)}
      >
        {label}
      </button>
    );
  }
  return (
    <>
      {cancel.isError && (
        <span className='self-center text-xs text-red-300'>
          {cancel.error.message}
        </span>
      )}
      <button
        type='button'
        className={cn(
          small,
          'border-red-400/50 text-red-200 hover:bg-red-950/60',
        )}
        disabled={cancel.isPending}
        onClick={() => cancel.mutate(id)}
      >
        Yes, cancel
      </button>
      <button
        type='button'
        className={small}
        onClick={() => setConfirming(false)}
      >
        Keep
      </button>
    </>
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
  const waiting = inviteOpen(game);
  const flipped = game.mode === 'online' && seat === 'b';
  const detail = [
    game.mode === 'online' &&
      `${game.challenge?.you ? 'You’d play' : 'You play'} ${colorName(
        seat,
      ).toLowerCase()}`,
    timeAgo(game.updatedAt),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={cn(
        'relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-[#262421] p-2.5 pr-3 transition-colors hover:bg-[#2c2a26]',
        status.tone === 'gold' && 'ring-1 ring-[#c98a1c]/45',
        game.archived && 'opacity-70',
      )}
    >
      <div className='flex min-w-0 flex-[1_1_320px] items-center gap-3'>
        <MiniBoard pieces={game.pieces} flipped={flipped} />
        <div className='min-w-0 flex-1'>
          <strong className='flex min-w-0 items-center gap-1.5 font-semibold text-white'>
            <OpponentLabel game={game} email={email} />
          </strong>
          <Link
            href={gamePath(game.id)}
            className={cn(muted, 'block truncate', stretchedLink)}
          >
            {detail}
          </Link>
        </div>
        {!waiting && <Chip {...status} />}
      </div>
      {(waiting || game.winner) && (
        <div className='relative z-10 ml-auto flex gap-2'>
          {game.challenge?.you && <AnswerChallenge id={game.id} />}
          {waiting && !game.challenge?.you && (
            <>
              {game.inviteToken && (
                <CopyInvite id={game.id} token={game.inviteToken} />
              )}
              <CancelInvite
                id={game.id}
                label={
                  game.matchmaking
                    ? 'Stop looking'
                    : game.challenge
                    ? 'Withdraw'
                    : 'Cancel game'
                }
              />
            </>
          )}
          {game.winner &&
            (game.rematchId ? (
              <Link href={gamePath(game.rematchId)} className={small}>
                Go to rematch
              </Link>
            ) : (
              <button
                type='button'
                className={small}
                disabled={rematchBusy}
                onClick={() => onRematch(game.id)}
              >
                Rematch
              </button>
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
  icon,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  children: ReactNode;
}) => (
  <div className='flex flex-col gap-3 rounded-xl bg-[#262421] p-4'>
    <div className='flex items-start gap-3'>
      {icon}
      <div>
        <h3 className='font-semibold text-white'>{title}</h3>
        <p className={muted}>{text}</p>
      </div>
    </div>
    <div className='mt-auto flex'>{children}</div>
  </div>
);

// The players you follow, to pick one to challenge
const ChallengePicker = ({
  onPick,
  busy,
}: {
  onPick: (playerId: number) => void;
  busy: boolean;
}) => {
  const following = useFollowing();
  if (following.isPending) {
    return <div className='h-12 animate-pulse rounded-xl bg-[#262421]' />;
  }
  if (following.isError) {
    return <p className='text-sm text-red-300'>{following.error.message}</p>;
  }
  if (!following.data.length) {
    return (
      <p className={cn(muted, 'rounded-xl bg-[#262421] p-4')}>
        You aren’t following anyone yet. Tap a player’s name in any game to open
        their page and follow them.
      </p>
    );
  }
  return (
    <div className='flex flex-wrap gap-2 rounded-xl bg-[#262421] p-3'>
      {following.data.map((player) => (
        <button
          key={player.id}
          type='button'
          disabled={busy}
          onClick={() => onPick(player.id)}
          className='flex cursor-pointer items-center gap-2 rounded-full border border-[#514d47] bg-[#302d29] py-1 pr-3.5 pl-1 text-sm font-semibold text-[#e8e4dc] hover:bg-[#3a3733] disabled:cursor-default disabled:opacity-50'
        >
          <PlayerAvatar icon={player.icon} className='size-7' />
          {player.name}
        </button>
      ))}
    </div>
  );
};

const LobbyPage = ({ email }: { email: string }) => {
  const router = useRouter();
  const games = useGames();
  const stats = useStats();
  const profile = useProfile();
  const create = useCreateGame();
  const [showArchived, setShowArchived] = useState(false);
  const [picking, setPicking] = useState(false);

  const open = ({ id }: { id: number }) => router.push(gamePath(id));
  const challenge = (playerId: number) =>
    create.mutate({ challenge: playerId }, { onSuccess: open });
  const start = (mode: 'online' | 'local' | 'random') =>
    create.mutate({ mode }, { onSuccess: open });
  const rematch = (id: number) =>
    create.mutate({ rematchOf: id }, { onSuccess: open });

  const list = useMemo(() => games.data ?? [], [games.data]);
  const visible = list.filter((game) => !game.archived);
  const archived = list.filter((game) => game.archived);
  // Games waiting on you float to the top; games still missing a player
  // (invites, challenges, random searches) wait in their own section
  const active = visible
    .filter((game) => !game.winner && !inviteOpen(game))
    .sort((a, b) => Number(b.yourMove) - Number(a.yourMove));
  const waiting = visible
    .filter((game) => !game.winner && inviteOpen(game))
    .sort(
      (a, b) =>
        Number(Boolean(b.challenge?.you)) - Number(Boolean(a.challenge?.you)),
    );
  const finished = visible.filter((game) => game.winner);

  const alerts = useMemo(
    () =>
      games.data
        ?.filter((game) => game.yourMove || game.challenge?.you)
        .map((game) => ({
          id: game.id,
          text: game.yourMove
            ? `Your move ${opponentOf(game, email)}`
            : opponentOf(game, email),
        })),
    [games.data, email],
  );
  const challenged = waiting.filter((game) => game.challenge?.you).length;
  const notify = useYourMoveAlerts(alerts);
  const yourMove = list.filter((game) => game.yourMove).length;

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
    <RemorseLayout actions={<DefaultActions getApp />}>
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
              {profile.data ? (
                <PlayerLink id={profile.data.id}>
                  {profile.data.username}
                </PlayerLink>
              ) : (
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
              icon={<DieIcon />}
              title='Play someone random'
              text='Get paired with the next player looking for a game.'
            >
              <button
                type='button'
                className={primary}
                disabled={create.isPending}
                onClick={() => start('random')}
              >
                Find an opponent
              </button>
            </ModeCard>
            <ModeCard
              icon={<SwordsIcon />}
              title='Challenge a friend'
              text='Pick someone you follow. The game starts when they accept.'
            >
              <button
                type='button'
                className={ghost}
                disabled={create.isPending}
                onClick={() => setPicking(!picking)}
              >
                {picking ? 'Hide players' : 'Pick a player'}
              </button>
            </ModeCard>
            <ModeCard
              icon={<LetterIcon />}
              title='Invite by link'
              text='Get an invite link to send. They join from any device.'
            >
              <button
                type='button'
                className={ghost}
                disabled={create.isPending}
                onClick={() => start('online')}
              >
                Start online game
              </button>
            </ModeCard>
            <ModeCard
              icon={<BoardIcon />}
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
          {picking && (
            <div className='mt-3.5'>
              <ChallengePicker onPick={challenge} busy={create.isPending} />
            </div>
          )}
          <Link
            href='/projects/remorse-chess/tutorial'
            className='mt-3 inline-block text-[15px] font-semibold text-[#ffd27a] hover:underline'
          >
            New to Remorse? Play the tutorial →
          </Link>
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

        {waiting.length > 0 && (
          <section>
            <h2 className={cn(h2, 'flex items-center gap-2')}>
              Waiting
              {challenged > 0 && (
                <span
                  className='grid h-6 min-w-6 place-items-center rounded-full bg-[#c62828] px-1.5 text-xs font-bold text-white tabular-nums shadow-[0_1px_0_#120d0b]'
                  title={`${challenged} waiting on your answer`}
                  aria-label={`${challenged} waiting on your answer`}
                >
                  {challenged}
                </span>
              )}
            </h2>
            <div className='flex flex-col gap-2'>{waiting.map(row)}</div>
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

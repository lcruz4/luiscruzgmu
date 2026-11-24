import Link from 'next/link';
import { useRouter } from 'next/router';
import { MiniBoard } from '@/components/remorse-chess/MiniBoard';
import { PlayerAvatar } from '@/components/remorse-chess/PlayerAvatar';
import {
  PlayerLink,
  stretchedLink,
} from '@/components/remorse-chess/PlayerLink';
import {
  FatesCard,
  RecordCard,
  Tally,
} from '@/components/remorse-chess/RecordCard';
import {
  DefaultActions,
  RemorseLayout,
} from '@/components/remorse-chess/RemorseLayout';
import {
  useCreateGame,
  useFollow,
  usePlayer,
} from '@/components/remorse-chess/useGame';
import {
  buttonSm,
  ghostButton,
  goldButton,
} from '@/components/remorse-chess/buttons';
import { colorName, resultText } from '@/lib/remorse/describe';
import { gamePath } from '@/lib/remorse/paths';
import { cn } from '@/lib/utils';
import { requireLogin } from '@/services/auth';
import type { PlayerGame, PlayerPage } from '@/types/remorse';

const h2 = 'mb-3 text-xl font-bold text-white';
const muted = 'text-[13.5px] text-[#a29e96]';

// Anyone can open it and watch
const GameRow = ({
  game,
  player,
}: {
  game: PlayerGame;
  player: PlayerPage;
}) => {
  const status = game.winner
    ? resultText(game.winner)
    : `${colorName(game.turn)} to move`;
  return (
    <div className='relative flex items-center gap-3 rounded-xl bg-[#262421] p-2.5 pr-3 transition-colors hover:bg-[#2c2a26]'>
      <MiniBoard pieces={game.pieces} flipped={game.blackId === player.id} />
      <div className='min-w-0 flex-1'>
        <strong className='flex min-w-0 flex-wrap items-center gap-x-1.5 font-semibold text-white'>
          <PlayerAvatar icon={game.whiteIcon} className='size-6' />
          <PlayerLink id={game.whiteId} className='truncate'>
            {game.whiteName}
          </PlayerLink>
          <span className='text-[#a29e96]'>vs</span>
          <PlayerAvatar icon={game.blackIcon} className='size-6' />
          <PlayerLink id={game.blackId} className='truncate'>
            {game.blackName}
          </PlayerLink>
        </strong>
        <Link
          href={gamePath(game.id)}
          className={cn(muted, 'block truncate', stretchedLink)}
        >
          {game.winner ? status : `In progress · ${status}`}
        </Link>
      </div>
      {!game.winner && (
        <span className='flex-none rounded-full border border-[#514d47] bg-[#302d29] px-2.5 py-0.5 text-xs font-semibold text-[#e8e4dc]'>
          Watch
        </span>
      )}
    </div>
  );
};

// Your games against this player: results, then how each side's pieces
// took their first captures
const HeadToHead = ({
  record,
  name,
}: {
  record: NonNullable<PlayerPage['headToHead']>;
  name: string;
}) => {
  const played = record.wins + record.losses + record.draws;
  return (
    <div className='flex flex-col gap-3.5'>
      <div className='flex flex-col gap-2.5 rounded-xl bg-[#262421] p-4'>
        <div className='grid grid-cols-3 gap-2'>
          <Tally value={record.wins} label='Your wins' gold />
          <Tally value={record.losses} label='Their wins' />
          <Tally value={record.draws} label='Draws' />
        </div>
        <p className={muted}>
          {played
            ? `${played} finished ${
                played === 1 ? 'game' : 'games'
              } between you.`
            : 'You haven’t finished a game against each other yet.'}
        </p>
      </div>
      <div className='grid gap-3.5 md:grid-cols-2'>
        <FatesCard
          traumas={record.yourTraumas}
          whose='Your'
          title={`How your pieces took it vs ${name}`}
        />
        <FatesCard
          traumas={record.theirTraumas}
          whose='Their'
          title='How their pieces took it vs you'
        />
      </div>
    </div>
  );
};

const Actions = ({ player }: { player: PlayerPage }) => {
  const router = useRouter();
  const follow = useFollow(player.id);
  const challenge = useCreateGame();
  if (player.you) {
    return (
      <Link
        href='/projects/remorse-chess/profile'
        className={cn(ghostButton, buttonSm)}
      >
        Edit your profile
      </Link>
    );
  }
  return (
    <div className='flex w-full flex-col gap-2 sm:w-auto'>
      <div className='flex flex-wrap gap-2'>
        {player.followsYou && (
          <button
            type='button'
            className={cn(goldButton, buttonSm)}
            disabled={challenge.isPending}
            onClick={() =>
              challenge.mutate(
                { challenge: player.id },
                { onSuccess: ({ id }) => router.push(gamePath(id)) },
              )
            }
          >
            Challenge
          </button>
        )}
        <button
          type='button'
          className={cn(ghostButton, buttonSm)}
          disabled={follow.isPending}
          onClick={() => follow.mutate(!player.following)}
        >
          {player.following ? '✓ Following' : '+ Follow'}
        </button>
      </div>
      {(challenge.error ?? follow.error) && (
        <p className='text-sm text-red-300'>
          {(challenge.error ?? follow.error)?.message}
        </p>
      )}
    </div>
  );
};

const PlayerPageView = () => {
  const router = useRouter();
  const id =
    typeof router.query.id === 'string' ? Number(router.query.id) : undefined;
  const player = usePlayer(id);
  const data = player.data;

  return (
    <RemorseLayout
      title={data ? `${data.name} · Remorse Chess` : undefined}
      actions={<DefaultActions />}
    >
      <div className='mx-auto flex max-w-[760px] flex-col gap-9 pt-3 text-[15px] leading-relaxed'>
        <Link
          href='/projects/remorse-chess'
          className='-mb-6 self-start text-sm text-[#a29e96] hover:text-white'
        >
          ← Your games
        </Link>
        {player.isError && (
          <p className='text-red-300'>{player.error.message}</p>
        )}
        {!data && !player.isError && (
          <div className='h-24 animate-pulse rounded-xl bg-[#262421]' />
        )}
        {data && (
          <>
            <section className='flex flex-wrap items-center gap-x-4 gap-y-3'>
              <PlayerAvatar icon={data.icon} className='size-16 border-[3px]' />
              <div className='min-w-0 flex-1'>
                <h1 className='truncate text-[clamp(26px,4.5vw,34px)] leading-tight font-bold tracking-tight text-white'>
                  {data.name}
                  {data.you && (
                    <span className='ml-2 text-base font-normal text-[#a29e96]'>
                      (you)
                    </span>
                  )}
                </h1>
              </div>
              <Actions player={data} />
            </section>

            {data.headToHead && (
              <section>
                <h2 className={h2}>You vs {data.name}</h2>
                <HeadToHead record={data.headToHead} name={data.name} />
              </section>
            )}

            <section>
              <h2 className={h2}>Record</h2>
              <RecordCard stats={data.stats} you={data.you} />
            </section>

            <section>
              <h2 className={h2}>Games</h2>
              {data.games.length ? (
                <div className='flex flex-col gap-2'>
                  {data.games.map((game) => (
                    <GameRow key={game.id} game={game} player={data} />
                  ))}
                </div>
              ) : (
                <p className={muted}>No online games yet.</p>
              )}
            </section>
          </>
        )}
      </div>
    </RemorseLayout>
  );
};

export const getServerSideProps = requireLogin('remorse-chess');

export default PlayerPageView;

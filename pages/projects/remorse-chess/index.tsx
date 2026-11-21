import Link from 'next/link';
import { useRouter } from 'next/router';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import { useCreateGame, useGames } from '@/components/remorse-chess/useGame';
import { colorName, resultText } from '@/lib/remorse/describe';
import { requireLogin } from '@/services/auth';
import type { GameSummary } from '@/types/remorse';

const button =
  'rounded-md border border-[#514d47] bg-[#3a3733] px-3 py-2 text-sm text-white hover:bg-[#4a4642] disabled:opacity-40';

const opponentOf = (game: GameSummary, email: string) => {
  if (game.mode === 'local') return 'Local game';
  const other = game.whiteEmail === email ? game.blackEmail : game.whiteEmail;
  return other ? `vs ${other}` : 'Waiting for an opponent';
};

const LobbyPage = ({ email }: { email: string }) => {
  const router = useRouter();
  const games = useGames();
  const create = useCreateGame();

  const start = (mode: 'online' | 'local', color: 'w' | 'b') =>
    create.mutate(
      { mode, color },
      { onSuccess: ({ id }) => router.push(`/projects/remorse-chess/${id}`) },
    );

  return (
    <RemorseLayout>
      <div className='mx-auto flex max-w-xl flex-col gap-6'>
        <section className='flex flex-col gap-3 rounded-xl bg-[#262421] p-4'>
          <h2 className='font-medium text-white'>New game</h2>
          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              className={button}
              disabled={create.isPending}
              onClick={() => start('online', 'w')}
            >
              Online, play white
            </button>
            <button
              type='button'
              className={button}
              disabled={create.isPending}
              onClick={() => start('online', 'b')}
            >
              Online, play black
            </button>
            <button
              type='button'
              className={button}
              disabled={create.isPending}
              onClick={() => start('local', 'w')}
            >
              Local, one device
            </button>
          </div>
          <p className='text-sm text-[#a29e96]'>
            Online games give you an invite link to send your opponent.
          </p>
          {create.isError && (
            <p className='text-sm text-red-300'>{create.error.message}</p>
          )}
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='font-medium text-white'>Your games</h2>
          {games.isError && (
            <p className='text-sm text-red-300'>{games.error.message}</p>
          )}
          {games.data?.length === 0 && (
            <p className='text-sm text-[#a29e96]'>Start a game above.</p>
          )}
          {games.data?.map((game) => (
            <Link
              key={game.id}
              href={`/projects/remorse-chess/${game.id}`}
              className='flex justify-between rounded-lg border border-[#3a3733] px-4 py-3 text-sm hover:bg-[#262421]'
            >
              <span>
                #{game.id} · {opponentOf(game, email)}
              </span>
              <span className='text-[#a29e96]'>
                {game.winner
                  ? resultText(game.winner)
                  : `${colorName(game.turn)} to move`}
              </span>
            </Link>
          ))}
        </section>
      </div>
    </RemorseLayout>
  );
};

export const getServerSideProps = requireLogin('remorse-chess');

export default LobbyPage;

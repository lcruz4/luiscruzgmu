import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { ChessComGameReponse } from '../../types/chess';
import Link from 'next/link';

interface GamesPanelProps {
  fetchedGames: ChessComGameReponse[];
  setFetchedGames: Dispatch<SetStateAction<ChessComGameReponse[]>>;
  setSelectedGame: Dispatch<SetStateAction<ChessComGameReponse | undefined>>;
  setActiveTab: Dispatch<SetStateAction<'games' | 'analysis'>>;
}

export const GamesPanel = ({
  fetchedGames,
  setFetchedGames,
  setSelectedGame,
  setActiveTab,
}: GamesPanelProps) => {
  const [fetchGamesError, setFetchGamesError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className='flex flex-col min-h-0 flex-1'>
      <h2 className='text-xl font-semibold mb-4'>Games</h2>

      <div className='font-sans flex-1 overflow-y-auto min-h-0'>
        <div className='mb-4 flex gap-2'>
          <input
            ref={inputRef}
            type='text'
            defaultValue={process.env.NEXT_PUBLIC_DEBUG ? 'kayzingzingy' : ''}
            placeholder='Enter your chess.com username'
            className='flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-400'
          />
          <button
            onClick={async () => {
              if (!inputRef.current?.value) {
                setFetchGamesError('Please enter a username.');
                return;
              }
              const now = new Date();
              const response = await fetch(
                `https://api.chess.com/pub/player/${inputRef.current
                  ?.value}/games/${now.getFullYear()}/${now.getMonth() + 1}`,
              );
              if (!response.ok) {
                setFetchGamesError(
                  'Failed to fetch games. Please check the username and try again.',
                );
                return;
              }

              const data = (await response.json()) as {
                games: ChessComGameReponse[];
              };
              data.games.sort((a, b) => b.end_time - a.end_time);
              setFetchedGames(data.games);
              setFetchGamesError('');
            }}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
          >
            Search
          </button>
        </div>
        {fetchGamesError && (
          <div className='text-red-500 mb-4'>{fetchGamesError}</div>
        )}
        <div>
          {fetchedGames.map((game) => {
            const eco = game.eco.split(/\d/)[0].split('/');
            const opening = eco[eco.length - 1].replaceAll('-', ' ');

            return (
              <div
                key={game.uuid}
                className='mb-4 p-4 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors flex items-center justify-between'
                onClick={() => {
                  setSelectedGame(game);
                  setActiveTab('analysis');
                }}
              >
                <div className='text-sm text-gray-300 flex-1'>
                  <div>
                    Game: {game.white.username} ({game.white.rating}) vs{' '}
                    {game.black.username} ({game.black.rating})
                  </div>
                  <div>
                    Time Control: {`${game.time_class} (${game.time_control})`}
                  </div>
                  <div>
                    Result:{' '}
                    {game.white.result === 'win'
                      ? `${game.white.username} wins`
                      : game.black.result === 'win'
                      ? `${game.black.username} wins`
                      : 'Draw'}
                  </div>
                  <div>
                    Opening:{' '}
                    <Link
                      href={game.eco}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-400 hover:underline'
                      onClick={(e) => e.stopPropagation()}
                    >
                      {opening}
                    </Link>
                  </div>
                  <div>
                    <Link
                      href={game.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-400 hover:underline'
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Game on Chess.com
                    </Link>
                  </div>
                </div>
                <div className='ml-4 text-gray-400'>
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

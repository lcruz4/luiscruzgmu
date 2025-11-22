import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ChessComGameReponse } from '../../types/chess';

interface PlayerBannerProps {
  isWhite: boolean;
  selectedGame?: ChessComGameReponse;
}

export const PlayerBanner = ({ isWhite, selectedGame }: PlayerBannerProps) => {
  const whiteAvatar = useQuery<{ avatar: string }>({
    queryKey: ['chess-user', selectedGame?.white['@id']],
    queryFn: async () => {
      if (!selectedGame) throw new Error('No game selected');
      const response = await fetch(selectedGame.white['@id']);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    enabled: !!selectedGame,
  });

  const blackAvatar = useQuery<{ avatar: string }>({
    queryKey: ['chess-user', selectedGame?.black['@id']],
    queryFn: async () => {
      if (!selectedGame) throw new Error('No game selected');
      const response = await fetch(selectedGame.black['@id']);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    enabled: !!selectedGame,
  });

  const colorClasses = isWhite
    ? 'bottom-[-48px] right-0'
    : 'top-[-48px] left-0';
  const avatarSrc = isWhite
    ? whiteAvatar.data?.avatar ?? '/images/wk.png'
    : blackAvatar.data?.avatar ?? '/images/bk.png';
  const playerName = isWhite
    ? selectedGame?.white.username ?? 'White Player'
    : selectedGame?.black.username ?? 'Black Player';
  const playerRating = isWhite
    ? selectedGame?.white.rating
    : selectedGame?.black.rating;
  return (
    <div className={`PlayerBanner.tsx absolute ${colorClasses} h-12 flex flex-row gap-2`}>
      {isWhite && (
        <p className='text-white text-sm text-center mt-1'>
          {playerName}{' '}
          {selectedGame && (
            <span className='font-sans'>{`(${playerRating})`}</span>
          )}
        </p>
      )}
      <Image
        src={avatarSrc}
        alt={playerName}
        className='h-12 w-12 rounded-md object-cover'
        width={48}
        height={48}
      />
      {!isWhite && (
        <p className='text-white text-sm text-center mt-1'>
          {playerName}{' '}
          {selectedGame && (
            <span className='font-sans'>{`(${playerRating})`}</span>
          )}
        </p>
      )}
    </div>
  );
};

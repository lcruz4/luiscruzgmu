import React from 'react';
import StickerItem from './StickerItem';

interface StickerData {
  id: string;
  emoji: string;
  isNew: boolean;
}

interface StickerGridProps {
  stickers: StickerData[];
  removingId: string | null;
  onRemoveSticker: (index: number) => void;
  isLoading: boolean;
}

const StickerGrid: React.FC<StickerGridProps> = ({
  stickers,
  removingId,
  onRemoveSticker,
  isLoading,
}) => {
  return (
    <div className='mb-6 sm:mb-8'>
      <h2 className='text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 text-purple-600'>
        🎪 Your Sticker Collection 🎪
      </h2>

      <div className='grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1 sm:gap-2 md:gap-2 p-3 sm:p-4 md:p-6 bg-gradient-to-r from-yellow-100 to-pink-100 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-dashed border-yellow-400 min-h-[180px] sm:min-h-[200px] place-items-center'>
        {stickers.map((stickerData, index) => (
          <StickerItem
            key={stickerData.id}
            sticker={stickerData.emoji}
            index={index}
            isNew={stickerData.isNew}
            isRemoving={removingId === stickerData.id}
            onRemove={onRemoveSticker}
            isLoading={isLoading}
          />
        ))}

        {/* Empty slots to show potential */}
        <div className='relative w-full h-full'>
          <div className='aspect-square w-full max-w-[3rem] sm:max-w-[4rem] md:max-w-[5rem] lg:max-w-[6rem] xl:max-w-[7rem] bg-white/50 rounded-full border-2 sm:border-3 lg:border-4 border-dashed border-gray-300 flex items-center justify-center overflow-hidden'>
            <span className='text-sm sm:text-lg md:text-2xl lg:text-3xl xl:text-4xl text-gray-300 leading-none select-none'>
              ✨
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerGrid;

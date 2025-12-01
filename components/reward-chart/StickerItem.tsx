import React, { useState, useEffect } from 'react';

interface StickerItemProps {
  sticker: string;
  index: number;
  isNew: boolean;
  isRemoving: boolean;
  onRemove: (index: number) => void;
  isLoading: boolean;
}

const StickerItem: React.FC<StickerItemProps> = ({
  sticker,
  index,
  isNew,
  isRemoving,
  onRemove,
  isLoading,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      // Check if it's a touch device and has a small screen
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768; // md breakpoint
      setIsMobile(hasTouchScreen && isSmallScreen);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const getRandomAnimation = () => {
    const animationClasses = [
      'animate__bounceIn',
      'animate__rubberBand',
      'animate__tada',
      'animate__swing',
    ];
    return animationClasses[
      Math.floor(Math.random() * animationClasses.length)
    ];
  };

  const getRandomExitAnimation = () => {
    const exitAnimations = ['animate__zoomOut', 'animate__flipOutX'];
    return exitAnimations[Math.floor(Math.random() * exitAnimations.length)];
  };

  const getAnimationClass = () => {
    if (isRemoving) {
      return getRandomExitAnimation();
    }
    if (isNew) {
      return getRandomAnimation();
    }
    return ''; // No animation for existing stickers
  };

  return (
    <div className="relative w-full h-full group">
      <div
        className={`animate__animated ${getAnimationClass()} aspect-square w-full max-w-[3rem] sm:max-w-[4rem] md:max-w-[5rem] lg:max-w-[6rem] xl:max-w-[7rem] text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl bg-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 border-2 sm:border-3 lg:border-4 border-yellow-400 ${
          isMobile ? 'cursor-pointer' : 'cursor-default'
        } relative flex items-center justify-center overflow-hidden ${
          isLoading ? 'pointer-events-none' : ''
        }`}
        style={{
          animationDuration: isRemoving ? '0.6s' : '1s',
        }}
        onClick={() => {
          if (!isLoading && isMobile) {
            onRemove(index);
          }
        }}
      >
        <span className="select-none leading-none">{sticker}</span>
      </div>
      <button
        className={`absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 lg:-top-2 lg:-right-2 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm rounded-full w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center transition-all duration-200 z-20 shadow-lg cursor-pointer ${
          isRemoving || isLoading ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isLoading) onRemove(index);
        }}
        disabled={isLoading || isRemoving}
        title="Remove sticker"
      >
        ✕
      </button>
    </div>
  );
};

export default StickerItem;

import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getStickers } from '../api/get-stickers';
import {
  StickerGrid,
  AddStickerForm,
  StatsPanel,
  getRandomEmoji,
  generateStickerId,
} from '../../components/reward-chart';

interface StickerData {
  id: string;
  emoji: string;
  isNew: boolean;
}

interface RewardChartProps {
  initialStickers: string[];
  email: string;
  category: string;
}

const RewardChart: React.FC<RewardChartProps> = ({
  initialStickers,
  email,
  category,
}) => {

  // Convert initial stickers to StickerData format
  const initializeStickerData = (stickers: string[]): StickerData[] => {
    return stickers.map((emoji) => ({
      id: generateStickerId(),
      emoji,
      isNew: false,
    }));
  };

  const [stickers, setStickers] = useState<StickerData[]>(
    initializeStickerData(initialStickers),
  );
  const [newSticker, setNewSticker] = useState(getRandomEmoji());
  const [isLoading, setIsLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Clear isNew flag after animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setStickers((prev) =>
        prev.map((sticker) => ({ ...sticker, isNew: false })),
      );
    }, 1000); // Animation duration

    return () => clearTimeout(timer);
  }, [stickers.length]);

  const addSticker = async () => {
    if (!email || !newSticker.trim()) {
      return;
    }

    setIsLoading(true);

    // Create new sticker with animation flag
    const newStickerData: StickerData = {
      id: generateStickerId(),
      emoji: newSticker,
      isNew: true,
    };

    // Optimistically update the UI
    const updatedStickers = [...stickers, newStickerData];
    setStickers(updatedStickers);
    setNewSticker(getRandomEmoji()); // Set new random emoji

    try {
      const response = await fetch('/api/add-sticker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          category,
          sticker: newSticker,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add sticker');
      }

      const result = await response.json();
      // Update with server response to ensure consistency
      const serverStickers = result.stickers.split(',').filter(Boolean);

      // Only update if there's a discrepancy
      if (serverStickers.length !== updatedStickers.length) {
        setStickers(initializeStickerData(serverStickers));
      }
    } catch (error) {
      console.error('Error adding sticker:', error);
      // Revert optimistic update on error
      setStickers(stickers);
      alert('Failed to add sticker. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSticker = async (indexToRemove: number) => {
    if (!email || isLoading || removingId !== null) return;

    const stickerToRemove = stickers[indexToRemove];
    if (!stickerToRemove) return;

    setIsLoading(true);
    setRemovingId(stickerToRemove.id);

    const originalStickers = [...stickers];

    // Wait for exit animation to complete before removing
    setTimeout(() => {
      setStickers((prev) => prev.filter((s) => s.id !== stickerToRemove.id));
      setRemovingId(null);
    }, 600); // Animation duration

    try {
      const response = await fetch('/api/remove-sticker', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          category,
          index: indexToRemove,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove sticker');
      }

      const result = await response.json();
      // Update with server response to ensure consistency
      const serverStickers = result.stickers
        ? result.stickers.split(',').filter(Boolean)
        : [];

      // Only update if there's a significant discrepancy after removal
      setTimeout(() => {
        if (Math.abs(serverStickers.length - stickers.length + 1) > 0) {
          setStickers(initializeStickerData(serverStickers));
        }
      }, 700); // After animation completes
    } catch (error) {
      console.error('Error removing sticker:', error);
      // Revert optimistic update on error
      setStickers(originalStickers);
      setRemovingId(null);
      alert('Failed to remove sticker. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomEmoji = () => {
    setNewSticker(getRandomEmoji());
  };

  return (
    <>
      <Head>
        <title>Luis Cruz | Sight Words Sticker Chart</title>
        <link
          rel='icon'
          href='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌟</text></svg>'
        />
      </Head>
      <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 px-2 sm:px-4 py-4 sm:py-6 md:py-8'>
        <div className='container mx-auto max-w-5xl'>
          {/* Animated Header */}
          <div className='text-center mb-6 sm:mb-8 animate__animated animate__bounceInDown'>
            <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg leading-tight'>
              🌟 Sight Words Sticker Chart 🌟
            </h1>
            <div className='text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 animate__animated animate__pulse animate__infinite'>
              ✨ Collect stickers for learning words! ✨
            </div>
          </div>

          {/* Main Chart Container */}
          <div className='bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border-4 sm:border-6 md:border-8 border-yellow-300 animate__animated animate__fadeInUp'>
            {/* Progress Banner */}
            <div className='bg-gradient-to-r from-green-400 to-blue-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-center'>
              <div className='text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2'>
                🎉 You have {stickers.length} amazing stickers! 🎉
              </div>
              <div className='text-sm sm:text-base md:text-lg lg:text-xl text-white/90'>
                Keep up the fantastic work!
              </div>
            </div>

            {/* Stickers Grid */}
            <StickerGrid
              stickers={stickers}
              removingId={removingId}
              onRemoveSticker={removeSticker}
              isLoading={isLoading}
            />

            {/* Add Sticker Section */}
            <AddStickerForm
              newSticker={newSticker}
              setNewSticker={setNewSticker}
              onAddSticker={addSticker}
              onRandomEmoji={handleRandomEmoji}
              isLoading={isLoading}
            />

            {/* Fun Stats */}
            <StatsPanel stickerCount={stickers.length} />
          </div>

          {/* Motivational Footer */}
          <div className='text-center animate__animated animate__fadeInUp animate__delay-1s'>
            <div className='text-lg sm:text-xl md:text-2xl lg:text-3xl text-white font-bold drop-shadow-lg mb-2 leading-tight'>
              🌟 You're doing AMAZING! Keep learning! 🌟
            </div>
            <div className='text-sm sm:text-base md:text-lg text-white/90'>
              Every sticker means you learned something new! 📚✨
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const category = 'sight_words';
  const email = context.req.headers['x-authenticated-email'] as string || "luiscruzgmu@gmail.com";

  try {
    const result = await getStickers(email, category);

    return {
      props: {
        initialStickers: result.stickers,
        email,
        category,
      },
    };
  } catch (error) {
    console.error('Error fetching stickers:', error);

    // Fallback to empty array if there's an error
    return {
      props: {
        initialStickers: [],
        email,
        category,
      },
    };
  }
};
export default RewardChart;

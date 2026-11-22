import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type BoardThemeId,
  DEFAULT_BOARD_THEME,
  isBoardTheme,
} from '@/lib/remorse/boardThemes';
import {
  DEFAULT_PIECE_SET,
  isPieceSet,
  type PieceSetId,
} from '@/lib/remorse/pieceSets';
import { useProfile } from './useGame';

interface BoardLook {
  pieceSet: PieceSetId;
  boardTheme: BoardThemeId;
}

const fieldOf = (persisted: unknown, key: keyof BoardLook) =>
  persisted && typeof persisted === 'object' && key in persisted
    ? Object.getOwnPropertyDescriptor(persisted, key)?.value
    : undefined;

// Last known choice, kept in the browser so the board doesn't change look
// while the profile loads. Hydrated by hand so the server render uses the
// defaults.
const useCachedLook = create<
  BoardLook & { setLook: (look: BoardLook) => void }
>()(
  persist(
    (set) => ({
      pieceSet: DEFAULT_PIECE_SET,
      boardTheme: DEFAULT_BOARD_THEME,
      setLook: (look) => set(look),
    }),
    {
      name: 'remorse-board-look',
      skipHydration: true,
      merge: (persisted, current) => {
        const pieceSet = fieldOf(persisted, 'pieceSet');
        const boardTheme = fieldOf(persisted, 'boardTheme');
        return {
          ...current,
          ...(isPieceSet(pieceSet) && { pieceSet }),
          ...(isBoardTheme(boardTheme) && { boardTheme }),
        };
      },
    },
  ),
);

// The signed-in player's piece set and board colors, from their profile
export const useBoardLook = (): BoardLook => {
  const profile = useProfile();
  const { pieceSet, boardTheme, setLook } = useCachedLook();
  const savedPieces = profile.data?.pieceSet;
  const savedBoard = profile.data?.boardTheme;
  const loaded = profile.data !== undefined;

  useEffect(() => {
    useCachedLook.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setLook({
      pieceSet: savedPieces ?? DEFAULT_PIECE_SET,
      boardTheme: savedBoard ?? DEFAULT_BOARD_THEME,
    });
  }, [loaded, savedPieces, savedBoard, setLook]);

  return { pieceSet, boardTheme };
};

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_PIECE_SET,
  isPieceSet,
  type PieceSetId,
} from '@/lib/remorse/pieceSets';
import { useProfile } from './useGame';

// Last known choice, kept in the browser so pieces don't swap sets while the
// profile loads. Hydrated by hand so the server render uses the default.
const useCachedPieceSet = create<{
  pieceSet: PieceSetId;
  setPieceSet: (pieceSet: PieceSetId) => void;
}>()(
  persist(
    (set) => ({
      pieceSet: DEFAULT_PIECE_SET,
      setPieceSet: (pieceSet) => set({ pieceSet }),
    }),
    {
      name: 'remorse-piece-set',
      skipHydration: true,
      merge: (persisted, current) => {
        const saved =
          persisted && typeof persisted === 'object' && 'pieceSet' in persisted
            ? persisted.pieceSet
            : undefined;
        return isPieceSet(saved) ? { ...current, pieceSet: saved } : current;
      },
    },
  ),
);

// The signed-in player's piece set, from their profile
export const usePieceSet = () => {
  const profile = useProfile();
  const { pieceSet, setPieceSet } = useCachedPieceSet();
  const saved = profile.data?.pieceSet;

  useEffect(() => {
    useCachedPieceSet.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (profile.data) setPieceSet(saved ?? DEFAULT_PIECE_SET);
  }, [profile.data, saved, setPieceSet]);

  return pieceSet;
};

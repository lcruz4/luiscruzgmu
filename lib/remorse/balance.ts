import type { Trauma } from '@/types/remorse';
import { traumaForRoll } from './engine';

// Balance mode: the die leans toward the lower-rated player. A balanced game
// keeps the odds it rolled with (games.balance) along with BALANCE_VERSION,
// so scripts/remorse-balance-report.sql can compare versions. Bump the
// version whenever a constant here changes.
export const BALANCE_VERSION = 1;

// How far the die tilts per 400 rating points between the players, and the
// most it ever tilts
const TILT_PER_400 = 0.5;
const MAX_TILT = 1;

// How good each face (1 to 6) is for the piece that rolls it: devastated,
// guilt, guilt, unaffected, unaffected, psychopath
const FACE_GOODNESS = [-2, -1, -1, 0, 0, 2];

// Suggest a balanced game once a pair has played this many standard games
// and one side has won at least this share of them
export const SUGGEST_MIN_GAMES = 5;
export const SUGGEST_WIN_RATE = 0.8;

// Each face's chance, 1 to 6
export type DieOdds = number[];

export const FAIR_ODDS: DieOdds = FACE_GOODNESS.map(() => 1 / 6);

export const balancedOdds = (
  rating: number,
  opponentRating: number,
): DieOdds => {
  const tilt = Math.max(
    -MAX_TILT,
    Math.min(MAX_TILT, (TILT_PER_400 * (opponentRating - rating)) / 400),
  );
  const weights = FACE_GOODNESS.map((goodness) => Math.exp(tilt * goodness));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
};

const RESOLUTION = 1_000_000;

// random(n): a whole number from 0 to n - 1
export const rollWithOdds = (
  odds: DieOdds,
  random: (max: number) => number,
) => {
  let pick = random(RESOLUTION) / RESOLUTION;
  for (const [i, chance] of odds.entries()) {
    pick -= chance;
    if (pick < 0) return i + 1;
  }
  return odds.length;
};

export const traumaOdds = (odds: DieOdds): Record<Trauma, number> => {
  const result: Record<Trauma, number> = {
    devastated: 0,
    guilt: 0,
    unaffected: 0,
    psychopath: 0,
  };
  for (const [i, chance] of odds.entries()) {
    result[traumaForRoll(i + 1)] += chance;
  }
  return result;
};

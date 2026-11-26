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

// A balanced game's creator can set each side's odds by hand before the
// first move, in whole percents per trauma
export const TRAUMAS: Trauma[] = [
  'devastated',
  'guilt',
  'unaffected',
  'psychopath',
];

export type TraumaPercents = Record<Trauma, number>;

// Whole numbers that add up to total, each as close to its share as can be
const roundToTotal = (raw: number[], total: number) => {
  const floors = raw.map(Math.floor);
  let left = total - floors.reduce((sum, n) => sum + n, 0);
  const byRemainder = raw
    .map((n, i) => ({ i, remainder: n - floors[i] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    floors[i]++;
    left--;
  }
  return floors;
};

// Whole percents that add up to 100
export const roundPercents = (percents: TraumaPercents): TraumaPercents => {
  const rounded = roundToTotal(
    TRAUMAS.map((trauma) => percents[trauma]),
    100,
  );
  return {
    devastated: rounded[0],
    guilt: rounded[1],
    unaffected: rounded[2],
    psychopath: rounded[3],
  };
};

export const toPercents = (odds: Record<Trauma, number>): TraumaPercents =>
  roundPercents({
    devastated: odds.devastated * 100,
    guilt: odds.guilt * 100,
    unaffected: odds.unaffected * 100,
    psychopath: odds.psychopath * 100,
  });

// Guilt and unaffected each own two faces; they split their share evenly
export const facesFromPercents = (percents: TraumaPercents): DieOdds => {
  const { devastated, guilt, unaffected, psychopath } = percents;
  return [
    devastated,
    guilt / 2,
    guilt / 2,
    unaffected / 2,
    unaffected / 2,
    psychopath,
  ].map((n) => n / 100);
};

export const isValidPercents = (value: unknown): value is TraumaPercents => {
  if (typeof value !== 'object' || value === null) return false;
  let total = 0;
  for (const trauma of TRAUMAS) {
    const n: unknown = Reflect.get(value, trauma);
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 100) {
      return false;
    }
    total += n;
  }
  return total === 100;
};

// Moves one trauma to a whole-percent target; the unlocked others make up the
// difference in proportion to their size, so the total stays 100. Their shares
// stay unrounded so repeated small steps don't all land on the biggest; show
// and save them through roundPercents.
export const adjustPercents = (
  percents: TraumaPercents,
  locked: Trauma[],
  trauma: Trauma,
  target: number,
): TraumaPercents => {
  const others = TRAUMAS.filter(
    (other) => other !== trauma && !locked.includes(other),
  );
  if (!others.length) return percents;
  const pool = others.reduce((sum, other) => sum + percents[other], 0);
  const value = Math.round(
    Math.max(0, Math.min(percents[trauma] + pool, target)),
  );
  const rest = pool - (value - percents[trauma]);
  const next = { ...percents, [trauma]: value };
  for (const other of others) {
    next[other] =
      pool > 0 ? (percents[other] * rest) / pool : rest / others.length;
  }
  return next;
};

// Glicko-1, the system chess.com rates with. Every finished game is its own
// rating period. db/remorse/014_ratings.sql backfills with the same math, so
// change both together.
export const INITIAL_RATING = 1200;
export const MAX_RD = 350;
const MIN_RD = 45;
// RD climbs back from 50 to 350 over a year without rated games
const RD_GROWTH_PER_DAY = (MAX_RD ** 2 - 50 ** 2) / 365;
const Q = Math.LN10 / 400;
const DAY_MS = 86_400_000;

export interface Rating {
  rating: number;
  rd: number;
}

const g = (rd: number) =>
  1 / Math.sqrt(1 + (3 * Q ** 2 * rd ** 2) / Math.PI ** 2);

// Uncertainty grows with time since the last rated game
export const inflatedRd = (rd: number, ratedAt: Date | null, now: Date) => {
  if (!ratedAt) return rd;
  const days = Math.max(0, now.getTime() - ratedAt.getTime()) / DAY_MS;
  return Math.min(MAX_RD, Math.sqrt(rd ** 2 + RD_GROWTH_PER_DAY * days));
};

// score: 1 win, 0.5 draw, 0 loss. Both sides' RDs already inflated.
export const rate = (
  player: Rating,
  opponent: Rating,
  score: number,
): Rating => {
  const gj = g(opponent.rd);
  const expected =
    1 / (1 + 10 ** ((-gj * (player.rating - opponent.rating)) / 400));
  const dSquared = 1 / (Q ** 2 * gj ** 2 * expected * (1 - expected));
  const precision = 1 / player.rd ** 2 + 1 / dSquared;
  return {
    rating: player.rating + (Q / precision) * gj * (score - expected),
    rd: Math.max(MIN_RD, Math.sqrt(1 / precision)),
  };
};

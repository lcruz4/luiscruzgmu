export type TimeCategory = 'bullet' | 'blitz' | 'rapid' | 'daily';

export const TIME_CATEGORIES: TimeCategory[] = [
  'bullet',
  'blitz',
  'rapid',
  'daily',
];

export const CATEGORY_NAMES: Record<TimeCategory, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  daily: 'Daily',
};

export interface TimeControl {
  id: string;
  category: TimeCategory;
  label: string;
  // live: each side's starting time and what a finished turn adds
  initialMs: number;
  incrementMs: number;
  // daily: the time allowed for each move
  perMoveMs: number;
}

const MIN = 60_000;
const DAY = 86_400_000;

const live = (
  category: TimeCategory,
  minutes: number,
  incrementSeconds: number,
): TimeControl => ({
  id: `${minutes}+${incrementSeconds}`,
  category,
  label: incrementSeconds
    ? `${minutes} + ${incrementSeconds}`
    : `${minutes} min`,
  initialMs: minutes * MIN,
  incrementMs: incrementSeconds * 1000,
  perMoveMs: 0,
});

const daily = (days: number): TimeControl => ({
  id: `${days}d`,
  category: 'daily',
  label: days === 1 ? '1 day' : `${days} days`,
  initialMs: 0,
  incrementMs: 0,
  perMoveMs: days * DAY,
});

export const TIME_CONTROLS: TimeControl[] = [
  live('bullet', 1, 0),
  live('bullet', 1, 1),
  live('bullet', 2, 1),
  live('blitz', 3, 0),
  live('blitz', 3, 2),
  live('blitz', 5, 0),
  live('rapid', 10, 0),
  live('rapid', 10, 5),
  live('rapid', 15, 10),
  daily(1),
  daily(3),
  daily(7),
];

export const DEFAULT_TIME_CONTROL = '10+0';

// A live game is aborted, not lost, when a side doesn't make its first move
// this soon (or before its clock runs out, if sooner). Daily: within the
// usual time for a move.
export const FIRST_MOVE_MS = 30_000;

export const timeControlOf = (id: string | null) =>
  TIME_CONTROLS.find((control) => control.id === id) ?? null;

export const isTimeControl = (value: unknown): value is string =>
  typeof value === 'string' && timeControlOf(value) !== null;

// Untimed games from before time controls count as daily
export const categoryOf = (id: string | null): TimeCategory =>
  timeControlOf(id)?.category ?? 'daily';

// A clock that ticks while you sit there, not a deadline days away
export const isLive = (id: string | null) => {
  const category = timeControlOf(id)?.category;
  return category !== undefined && category !== 'daily';
};

import type { LogSet, PlanRow } from '@/types/workout';

export const DAY_TITLES = [
  'Chest · Triceps · Abs',
  'Back · Biceps',
  'Legs · Abs',
  'Shoulders · Arms',
];

// Numbers are lb; bands ('rb -1.5') and 'BW' stay as typed
export const isPounds = (weight: string) => /^[\d./]+$/.test(weight);

// No weight = bodyweight (except timed holds, where it's just omitted)
const atWeight = (weight: string | null, isTimed: boolean) => {
  if (weight === null) return isTimed ? '' : ' @ BW';
  return isPounds(weight) ? ` @ ${weight} lb` : ` @ ${weight}`;
};

const unit = (isTimed: boolean) => (isTimed ? ' s' : '');

// 3 × 10 @ 40 lb · 2 × 60 s
export const targetText = ({ sets, reps, weight, isTimed }: PlanRow) =>
  `${sets} × ${reps}${unit(isTimed)}${atWeight(weight, isTimed)}`;

// 15/15/15 @ 35 lb · 10/10/8 @ 65/70/80 lb · 45/45 s
export const setsText = (sets: LogSet[], isTimed: boolean) => {
  if (sets.length === 0) return 'No sets';
  const reps = sets.map((set) => set.reps ?? '–').join('/');
  const weights = sets.map((set) => set.weight);
  const weight =
    new Set(weights).size === 1
      ? weights[0]
      : weights.map((w) => w ?? 'BW').join('/');
  return `${reps}${unit(isTimed)}${atWeight(weight, isTimed)}`;
};

// YYYY-MM-DD as a local day (a bare date string parses as UTC)
const localDay = (date: string) => new Date(`${date}T00:00`);

// Mon, Oct 19
export const longDate = (date: string) =>
  localDay(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

// Oct 12
export const shortDate = (date: string) =>
  localDay(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

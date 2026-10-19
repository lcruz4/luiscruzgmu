import { readFileSync } from 'fs';
import path from 'path';

// Port of muscle-weights-verify.py: the seeded factors must reproduce the
// muscle set totals published in the workout reports (handoff §5.2).

const seed = readFileSync(
  path.join(__dirname, '../../db/workout/002_seed_catalog.sql'),
  'utf8',
);

const factors = new Map<string, Record<string, number>>();
for (const [, exercise, muscle, factor] of seed.matchAll(
  /\('([^']+)', '([a-z_]+)', ([\d.]+)\)/g,
)) {
  factors.set(exercise, { ...factors.get(exercise), [muscle]: Number(factor) });
}

const DEAD_HANG = 'Dead hang';

function tally(plan: [string, number][], setMultiplier: number) {
  const totals: Record<string, number> = {};
  for (const [exercise, sets] of plan) {
    const exerciseFactors = factors.get(exercise);
    if (!exerciseFactors) throw new Error(`No factors for ${exercise}`);
    const effectiveSets = exercise === DEAD_HANG ? sets : sets * setMultiplier;
    for (const [muscle, factor] of Object.entries(exerciseFactors)) {
      totals[muscle] = (totals[muscle] ?? 0) + factor * effectiveSets;
    }
  }
  return totals;
}

// Reports round to 1 decimal; accept either rounding at the .x5 boundary.
function expectTotals(
  totals: Record<string, number>,
  expected: Record<string, number>,
) {
  const mismatches = Object.entries(expected)
    .map(([muscle, value]) => ({ muscle, value, got: totals[muscle] ?? 0 }))
    .filter(({ value, got }) => Math.abs(got - value) > 0.05 + 1e-9);
  expect(mismatches).toEqual([]);
}

describe('exercise_muscles seed', () => {
  it('has the 28 verified exercises with 1 / 0.5 / 0.25 factors', () => {
    expect(factors.size).toBe(28);
    for (const exerciseFactors of factors.values()) {
      for (const factor of Object.values(exerciseFactors)) {
        expect([1, 0.5, 0.25]).toContain(factor);
      }
    }
  });

  it('matches the final plan muscle totals', () => {
    const finalPlan: [string, number][] = [
      ['Incline dumbbell press', 3],
      ['Dumbbell bench press', 3],
      ['Cable cross-over (band, mid)', 3],
      ['Tricep dips', 3],
      ['DB overhead triceps extension', 3],
      ['Dumbbell lateral raise', 4],
      ['Weighted bench crunch', 3],
      ['Pull-up (bar)', 3],
      ['Prone dumbbell row', 3],
      ['Chin-up (bar)', 3],
      ['Dumbbell reverse flye', 3],
      ['Incline biceps curl', 3],
      ['Dumbbell hammer curl', 3],
      [DEAD_HANG, 2],
      ['Front squat', 3],
      ['Romanian deadlift', 3],
      ['Bulgarian split squat', 3],
      ['Hamstring curl (band)', 3],
      ['Single-leg calf raise (stair)', 3],
      ['Hanging leg raise (bar)', 3],
      ['Barbell roll-out', 3],
      ['Dumbbell overhead press', 3],
      ['Dumbbell flye', 3],
      ['Single-arm dumbbell row', 3],
      ['Band lateral raise (low anchor)', 4],
      ['Band face pull', 3],
      ['Dumbbell skull crusher', 3],
      ['Incline biceps curl', 3],
    ];
    expectTotals(tally(finalPlan, 1), {
      biceps: 16.5,
      upper_back: 14.5,
      chest: 13.5,
      triceps: 13.5,
      lats: 13.2,
      abs: 12.8,
      front_delt: 10.5,
      rear_delt: 10.5,
      side_delt: 9.5,
      forearms: 9.5,
      glutes: 7.5,
      quads: 6.0,
      hams: 6.0,
      lower_back: 4.5,
      calves: 3.0,
    });
  });

  it('matches the audit v2 Plan B averages (3/4 sets → 3.5, dead hang fixed at 2)', () => {
    const planB: [string, number][] = [
      'Incline dumbbell press',
      'Dumbbell bench press',
      'Cable cross-over (band, mid)',
      'Tricep dips',
      'DB overhead triceps extension',
      'Dumbbell lateral raise',
      'Pull-up (bar)',
      'Prone dumbbell row',
      'Chin-up (bar)',
      'Dumbbell reverse flye',
      'Incline biceps curl',
      'Dumbbell hammer curl',
      'Front squat',
      'Romanian deadlift',
      'Bulgarian split squat',
      'Hamstring curl (band)',
      'Hanging leg raise (bar)',
      'Barbell roll-out',
      'Dumbbell overhead press',
      'Seated DB lateral raise',
      'Band face pull',
      'Dumbbell skull crusher',
      'Incline biceps curl',
      'Weighted bench crunch',
    ].map((exercise): [string, number] => [exercise, 1]);
    planB.push([DEAD_HANG, 2]);

    expectTotals(tally(planB, 3.5), {
      chest: 12.2,
      front_delt: 10.5,
      side_delt: 8.8,
      rear_delt: 10.5,
      lats: 11.9,
      upper_back: 13.2,
      biceps: 17.5,
      triceps: 15.8,
      forearms: 10.8,
      abs: 14.9,
      quads: 7.0,
      hams: 7.0,
      glutes: 8.8,
      lower_back: 5.2,
      calves: 0.0,
    });
  });
});

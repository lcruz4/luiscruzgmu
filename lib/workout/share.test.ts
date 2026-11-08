import type { DayExercise, DayLog } from '@/types/workout';
import { dayTable } from './share';

const exercise = (
  name: string,
  log: Partial<DayLog> | null,
  isTimed = false,
): DayExercise => ({
  id: 1,
  week: 1,
  day: 1,
  position: 1,
  exerciseId: 1,
  name,
  isTimed,
  sets: 3,
  reps: 10,
  weight: '50',
  notes: null,
  last: null,
  log: log && {
    id: 1,
    passed: null,
    notes: null,
    createdAt: '2026-11-08T12:00:00Z',
    sets: [],
    ...log,
  },
});

const set = (
  setNumber: number,
  reps: number | null,
  notes: string | null = null,
) => ({
  id: setNumber,
  setNumber,
  weight: '50',
  reps,
  notes,
});

describe('dayTable', () => {
  it('lists exercises without weights, planned sets when not logged', () => {
    expect(
      dayTable('Sat, Nov 7 · Day 3 · Legs', [
        exercise('Front squat', {
          passed: true,
          sets: [set(1, 8), set(2, 8), set(3, 7)],
        }),
        exercise('Dead hang', { sets: [set(1, 60), set(2, 45)] }, true),
        exercise('Not done', null),
      ]),
    ).toBe(
      [
        '*Sat, Nov 7 · Day 3 · Legs*',
        '| Exercise | Reps | Result | Note |',
        '| --- | --- | --- | --- |',
        '| Front squat | 8/8/7 | Pass |  |',
        '| Dead hang | 60/45 s |  |  |',
        '| Not done | 10/10/10 |  |  |',
      ].join('\n'),
    );
  });

  it('joins the exercise note and set notes, escaping pipes and newlines', () => {
    expect(
      dayTable('Day 1', [
        exercise('Dips', {
          passed: false,
          notes: 'a | b\nc',
          sets: [set(1, 10), set(2, null, 'elbow')],
        }),
      ]).split('\n')[3],
    ).toBe('| Dips | 10/– | Fail | a \\| b c; Set 2: elbow |');
  });
});

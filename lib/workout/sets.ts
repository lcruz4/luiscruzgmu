import type { DayExercise, DayLog, LogEntry, LogSet } from '@/types/workout';

/** One set row as typed; set numbers follow the row order */
export interface DraftSet {
  weight: string;
  reps: string;
  notes: string;
}

/** An exercise card's inputs not saved yet */
export interface ExerciseDraft {
  sets: DraftSet[];
  notes: string;
  passed: boolean | null;
}

type DraftSource = Pick<DayExercise, 'sets' | 'reps' | 'weight'> & {
  log: LogEntry | null;
};

// A row as planned: the plan's weight (D41) and reps
export const plannedSet = ({
  reps,
  weight,
}: Pick<DayExercise, 'reps' | 'weight'>): DraftSet => ({
  weight: weight ?? '',
  reps: String(reps),
  notes: '',
});

const toDraftSet = (set: LogSet): DraftSet => ({
  weight: set.weight ?? '',
  reps: set.reps === null ? '' : String(set.reps),
  notes: set.notes ?? '',
});

// The saved log, or the plan pre-filled when nothing is logged yet
export const initialDraft = (exercise: DraftSource): ExerciseDraft =>
  exercise.log
    ? {
        sets: exercise.log.sets.map(toDraftSet),
        notes: exercise.log.notes ?? '',
        passed: exercise.log.passed,
      }
    : {
        sets: Array.from({ length: exercise.sets }, () => plannedSet(exercise)),
        notes: '',
        passed: null,
      };

// The PUT log fields. Rows with no reps aren't stored.
export const draftToLog = ({ sets, notes, passed }: ExerciseDraft) => ({
  passed,
  notes: notes.trim() || null,
  sets: sets
    .filter((set) => set.reps !== '')
    .map((set) => ({
      weight: set.weight.trim() || null,
      reps: Number(set.reps),
      notes: set.notes.trim() || null,
    })),
});

// Notes are left out so editing a completed set's note doesn't uncomplete it
const sameSet = (a: DraftSet, b: DraftSet) =>
  a.weight.trim() === b.weight.trim() && a.reps === b.reps;

// Per row: weight and reps match the saved set at the same position
export const savedRows = (log: LogEntry | null, sets: DraftSet[]) =>
  sets.map((set, index) => {
    const saved = log?.sets[index];
    return saved !== undefined && sameSet(set, toDraftSet(saved));
  });

// Logged, and no row on the card left unsaved
export const allSetsSaved = (
  log: LogEntry | null,
  draft: ExerciseDraft | undefined,
) =>
  log !== null &&
  (draft === undefined || savedRows(log, draft.sets).every(Boolean));

// What the server will return for a save, so it shows before the response.
// Like the server, an empty log is deleted.
export const expectedLog = (
  log: DayLog | null,
  draft: ExerciseDraft,
): DayLog | null => {
  const { passed, notes, sets } = draftToLog(draft);
  if (passed === null && notes === null && sets.length === 0) return null;
  return {
    id: log?.id ?? 0,
    createdAt: log?.createdAt ?? new Date().toISOString(),
    passed,
    notes,
    sets: sets.map((set, index) => ({
      id: -(index + 1),
      setNumber: index + 1,
      ...set,
    })),
  };
};

// The saved log with one row swapped in. Set numbers are positions, so
// earlier rows that aren't saved yet go in too.
export const withSavedSet = (
  log: LogEntry | null,
  sets: DraftSet[],
  index: number,
): ExerciseDraft => {
  const saved = log ? log.sets.map(toDraftSet) : [];
  return {
    sets: Array.from(
      { length: Math.max(saved.length, index + 1) },
      (_unused, i) => (i === index ? sets[i] : saved[i] ?? sets[i]),
    ),
    notes: log?.notes ?? '',
    passed: log?.passed ?? null,
  };
};

// The saved log with the draft's notes, pass/fail and saved rows' set notes.
// Rows not saved yet stay as they were.
export const withDetails = (
  log: LogEntry | null,
  draft: ExerciseDraft,
): ExerciseDraft => {
  const rows = savedRows(log, draft.sets);
  return {
    sets: (log?.sets ?? []).map((set, index) =>
      rows[index] ? draft.sets[index] : toDraftSet(set),
    ),
    notes: draft.notes,
    passed: draft.passed,
  };
};

// The draft has notes or pass/fail that saving the sets alone wouldn't keep
export const detailsChanged = (log: LogEntry | null, draft: ExerciseDraft) =>
  JSON.stringify(draftToLog(withDetails(log, draft))) !==
  JSON.stringify(
    draftToLog(
      withDetails(log, {
        sets: [],
        notes: log?.notes ?? '',
        passed: log?.passed ?? null,
      }),
    ),
  );

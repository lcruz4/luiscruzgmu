import type { DayExercise, LogSet } from '@/types/workout';

/** One set row as typed; set numbers follow the row order */
export interface DraftSet {
  weight: string;
  reps: string;
  notes: string;
}

/** An exercise card's inputs, kept locally until Finish exercise saves them */
export interface ExerciseDraft {
  sets: DraftSet[];
  notes: string;
  passed: boolean | null;
}

type DraftSource = Pick<DayExercise, 'sets' | 'reps' | 'weight' | 'log'>;

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

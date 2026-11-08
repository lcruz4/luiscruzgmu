import type { DayExercise } from '@/types/workout';
import { allSetsSaved, type ExerciseDraft, savedRows } from './sets';

// Pipes would split a cell; newlines would end the row
const cell = (text: string) =>
  text.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');

const noteText = ({ log }: DayExercise) => {
  if (!log) return '';
  const setNotes = log.sets.flatMap((set) =>
    set.notes ? [`Set ${set.setNumber}: ${set.notes}`] : [],
  );
  return [log.notes, ...setNotes].filter(Boolean).join('; ');
};

const resultText = (passed: boolean | null) =>
  passed === null ? '' : passed ? 'Pass' : 'Fail';

// First exercise with a set not saved yet, and that set's number. undefined
// once every card is saved.
export const currentSet = (
  exercises: DayExercise[],
  drafts: Record<number, ExerciseDraft>,
) => {
  const exercise = exercises.find(
    ({ id, log }) => !allSetsSaved(log, drafts[id]),
  );
  if (!exercise) return undefined;
  const draft = drafts[exercise.id];
  const saved = draft ? savedRows(exercise.log, draft.sets) : [];
  const index = saved.indexOf(false);
  return { id: exercise.id, set: (index === -1 ? saved.length : index) + 1 };
};

// The day as a markdown table (Slack renders it), no weights. Exercises not
// logged yet show their planned sets; a Now column marks the current set.
// *heading*
// | Exercise | Reps | Result | Note | Now |
export const dayTable = (
  heading: string,
  exercises: DayExercise[],
  current?: { id: number; set: number },
) => {
  const rows = exercises.map((exercise) => {
    const { log, name, isTimed } = exercise;
    const reps = log
      ? log.sets.map((set) => set.reps ?? '–')
      : Array.from({ length: exercise.sets }, () => exercise.reps);
    return [
      name,
      `${reps.join('/')}${isTimed ? ' s' : ''}`,
      resultText(log?.passed ?? null),
      noteText(exercise),
      ...(current
        ? [current.id === exercise.id ? `▶ Set ${current.set}` : '']
        : []),
    ];
  });
  const head = [
    'Exercise',
    'Reps',
    'Result',
    'Note',
    ...(current ? ['Now'] : []),
  ];
  return [
    `*${heading}*`,
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');
};

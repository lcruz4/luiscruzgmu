import type { DayExercise } from '@/types/workout';

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

// The day as a markdown table (Slack renders it), no weights. Exercises not
// logged yet show their planned sets.
// *heading*
// | Exercise | Reps | Result | Note |
export const dayTable = (heading: string, exercises: DayExercise[]) => {
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
    ];
  });
  return [
    `*${heading}*`,
    '| Exercise | Reps | Result | Note |',
    '| --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');
};

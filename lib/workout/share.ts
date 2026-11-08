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

// Logged exercises as a markdown table (Slack renders it), no weights:
// *heading*
// | Exercise | Reps | Result | Note |
export const dayTable = (heading: string, exercises: DayExercise[]) => {
  const rows = exercises.flatMap((exercise) => {
    const { log, name, isTimed } = exercise;
    if (!log) return [];
    const reps = log.sets.map((set) => set.reps ?? '–').join('/');
    return [
      [
        name,
        `${reps}${isTimed ? ' s' : ''}`,
        resultText(log.passed),
        noteText(exercise),
      ],
    ];
  });
  return [
    `*${heading}*`,
    '| Exercise | Reps | Result | Note |',
    '| --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');
};

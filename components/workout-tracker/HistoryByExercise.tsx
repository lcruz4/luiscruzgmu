import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { HistoryEntry } from '@/types/workout';
import { EntryNotes, PassFail } from './EntryDetails';
import { longDate, setsText } from './format';

const labelClass =
  'text-[11px] font-bold tracking-[0.08em] text-mist-muted uppercase';

// Lists logged exercises only; starts on the most recently logged one
export const HistoryByExercise = ({ entries }: { entries: HistoryEntry[] }) => {
  const [exerciseId, setExerciseId] = useState(entries.at(0)?.exerciseId);
  const names = new Map(entries.map((entry) => [entry.exerciseId, entry.name]));
  const options = [...names].sort(([, a], [, b]) => a.localeCompare(b));
  const logs = entries.filter((entry) => entry.exerciseId === exerciseId);

  return (
    <main className='flex flex-1 flex-col gap-4 p-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='history-exercise' className={labelClass}>
          Exercise
        </label>
        <div className='relative'>
          <select
            id='history-exercise'
            value={exerciseId}
            onChange={(event) => setExerciseId(Number(event.target.value))}
            className='h-[52px] w-full cursor-pointer appearance-none rounded-[12px] border border-mist-line bg-mist-raised pr-11 pl-3.5 text-base font-bold text-mist-text'
          >
            {options.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={20}
            strokeWidth={2.25}
            aria-hidden
            className='pointer-events-none absolute top-4 right-3.5 text-mist-muted'
          />
        </div>
      </div>
      <ol className='m-0 flex list-none flex-col divide-y divide-mist-line rounded-2xl border border-mist-line bg-mist-surface p-0 shadow-mist-card'>
        {logs.map((entry) => (
          <li key={entry.id} className='flex flex-col gap-1 px-4 py-3.5'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-xs font-bold tracking-[0.08em] text-mist-muted uppercase'>
                {longDate(entry.date)} · W{entry.week} D{entry.day}
              </span>
              <PassFail passed={entry.passed} />
            </div>
            <span className='font-num text-[17px] leading-6 font-bold'>
              {setsText(entry.sets, entry.isTimed)}
            </span>
            <EntryNotes notes={entry.notes} sets={entry.sets} />
          </li>
        ))}
      </ol>
    </main>
  );
};

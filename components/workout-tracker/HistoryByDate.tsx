import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { HistoryEntry } from '@/types/workout';
import { EntryNotes, PassFail } from './EntryDetails';
import { DAY_TITLES, longDate, setsText } from './format';
import { useToday } from './useDay';

interface DayGroup {
  key: string;
  date: string;
  week: number;
  day: number;
  entries: HistoryEntry[];
}

// Entries come sorted by date, week, day, so each group is one run
const groupByDay = (entries: HistoryEntry[]) => {
  const groups: DayGroup[] = [];
  for (const entry of entries) {
    const { date, week, day } = entry;
    const key = `${date} W${week}D${day}`;
    const group = groups.at(-1);
    if (group?.key === key) group.entries.push(entry);
    else groups.push({ key, date, week, day, entries: [entry] });
  }
  return groups;
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

// 7 exercises · 21 sets · 6 pass · 1 fail
const summary = (entries: HistoryEntry[]) => {
  const sets = entries.reduce((total, entry) => total + entry.sets.length, 0);
  const passed = entries.filter((entry) => entry.passed === true).length;
  const failed = entries.filter((entry) => entry.passed === false).length;
  return [
    plural(entries.length, 'exercise'),
    plural(sets, 'set'),
    passed > 0 && `${passed} pass`,
    failed > 0 && `${failed} fail`,
  ]
    .filter(Boolean)
    .join(' · ');
};

interface DayGroupCardProps {
  group: DayGroup;
  today: string | undefined;
  open: boolean;
  onToggle: () => void;
}

const DayGroupCard = ({ group, today, open, onToggle }: DayGroupCardProps) => {
  const { date, week, day, entries } = group;
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <section className='rounded-2xl border border-mist-line bg-mist-surface shadow-mist-card'>
      <button
        type='button'
        aria-expanded={open}
        onClick={onToggle}
        className={cn(
          'flex w-full cursor-pointer items-center gap-3 py-3 pr-3 pl-4 text-left',
          open && 'border-b border-mist-line',
        )}
      >
        <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='text-xs font-bold tracking-[0.08em] text-mist-muted uppercase'>
            {date === today ? `Today · ${longDate(date)}` : longDate(date)}
          </span>
          <span className='text-base leading-[22px] font-extrabold'>
            Week {week} · Day {day} · {DAY_TITLES[day - 1]}
          </span>
          {!open && (
            <span className='text-[13px] font-semibold text-mist-muted'>
              {summary(entries)}
            </span>
          )}
        </span>
        <span className='flex size-8 shrink-0 items-center justify-center text-mist-muted'>
          <Chevron size={20} strokeWidth={2.25} aria-hidden />
        </span>
      </button>
      {open && (
        <ul className='m-0 flex list-none flex-col px-4 pt-1 pb-2'>
          {entries.map((entry) => (
            <li key={entry.id} className='flex flex-col gap-0.5 py-2'>
              <div className='flex items-start justify-between gap-2'>
                <span className='text-[15px] leading-5 font-bold'>
                  {entry.name}
                </span>
                <PassFail passed={entry.passed} />
              </div>
              <span className='font-num text-sm leading-5 font-medium'>
                {setsText(entry.sets, entry.isTimed)}
              </span>
              <EntryNotes notes={entry.notes} sets={entry.sets} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// Newest group starts open, older ones show their summary
export const HistoryByDate = ({ entries }: { entries: HistoryEntry[] }) => {
  const today = useToday();
  const groups = groupByDay(entries);
  const [openKeys, setOpenKeys] = useState(
    () => new Set(groups.slice(0, 1).map((group) => group.key)),
  );

  const toggle = (key: string) =>
    setOpenKeys((keys) => {
      const next = new Set(keys);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  return (
    <main className='flex flex-1 flex-col gap-4 p-4'>
      {groups.map((group) => (
        <DayGroupCard
          key={group.key}
          group={group}
          today={today}
          open={openKeys.has(group.key)}
          onToggle={() => toggle(group.key)}
        />
      ))}
    </main>
  );
};

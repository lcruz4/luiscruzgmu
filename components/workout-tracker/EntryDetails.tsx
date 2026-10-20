import { cn } from '@/lib/utils';
import type { HistoryEntry } from '@/types/workout';

// passed is only ever set on Week 2 logs
export const PassFail = ({ passed }: { passed: boolean | null }) => {
  if (passed === null) return null;
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold tracking-[0.06em] text-mist-ink uppercase',
        passed ? 'bg-mist-cyan' : 'bg-mist-pink',
      )}
    >
      {passed ? 'Pass' : 'Fail'}
    </span>
  );
};

const noteClass = 'text-[13px] leading-[18px] font-medium text-mist-muted';

// Exercise note, then any per-set notes
export const EntryNotes = ({
  notes,
  sets,
}: Pick<HistoryEntry, 'notes' | 'sets'>) => (
  <>
    {notes && <span className={cn(noteClass, 'italic')}>“{notes}”</span>}
    {sets
      .filter((set) => set.notes)
      .map((set) => (
        <span key={set.id} className={noteClass}>
          Set {set.setNumber}: <span className='italic'>“{set.notes}”</span>
        </span>
      ))}
  </>
);

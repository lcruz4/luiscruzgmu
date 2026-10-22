import { LinkIcon, Pencil } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PlanResponse, PlanRow } from '@/types/workout';
import { DAY_TITLES, targetText } from './format';
import { PlanRowEditor } from './PlanRowEditor';
import { badgeClass, cardClass } from './styles';

const WEEKS = [1, 2];

const RowList = ({
  rows,
  onEdit,
}: {
  rows: PlanRow[];
  onEdit: (id: number) => void;
}) =>
  rows.length === 0 ? null : (
    <div className={cn(cardClass, 'flex flex-col')}>
      {rows.map((row) => (
        <button
          key={row.id}
          type='button'
          onClick={() => onEdit(row.id)}
          className='flex min-h-[68px] w-full cursor-pointer items-center gap-3 border-b border-mist-line py-3 pr-3 pl-4 text-left last:border-b-0'
        >
          <span className={badgeClass()}>{row.position}</span>
          <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <span className='text-base leading-[22px] font-bold'>
              {row.name}
            </span>
            <span className='font-num text-sm font-medium text-mist-muted'>
              {targetText(row)}
            </span>
          </span>
          <span className='flex size-8 items-center justify-center text-mist-muted'>
            <Pencil size={18} strokeWidth={2} aria-hidden />
          </span>
        </button>
      ))}
    </div>
  );

export const PlanEditor = ({ plan, rows }: PlanResponse) => {
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(1);
  const [editingId, setEditingId] = useState<number>();

  const dayRows = rows.filter((row) => row.week === week && row.day === day);
  const editing = dayRows.find((row) => row.id === editingId);
  const split = editing ? dayRows.indexOf(editing) : dayRows.length;

  const select = (nextWeek: number, nextDay: number) => {
    setWeek(nextWeek);
    setDay(nextDay);
    setEditingId(undefined);
  };

  return (
    <>
      <header className='flex flex-col gap-1 border-b border-mist-line bg-mist-header px-4 pt-5 pb-4'>
        <h1 className='m-0 text-[26px] leading-8 font-extrabold'>Plan</h1>
        <div className='text-[15px] font-semibold text-mist-muted'>
          {plan.name} · active
        </div>
      </header>
      <main className='flex flex-1 flex-col gap-3 p-4'>
        <div
          role='group'
          aria-label='Week'
          className='grid grid-cols-2 gap-1 rounded-[14px] border border-mist-line bg-mist-surface p-1'
        >
          {WEEKS.map((w) => (
            <button
              key={w}
              type='button'
              aria-pressed={w === week}
              onClick={() => select(w, day)}
              className={cn(
                'h-11 cursor-pointer rounded-[10px] text-[15px]',
                w === week
                  ? cn(
                      'font-extrabold text-mist-ink',
                      w === 2 ? 'bg-mist-pink' : 'bg-mist-cyan',
                    )
                  : 'font-bold text-mist-muted',
              )}
            >
              Week {w}
            </button>
          ))}
        </div>

        <div role='group' aria-label='Day' className='grid grid-cols-4 gap-2'>
          {DAY_TITLES.map((title, i) => {
            const d = i + 1;
            const selected = d === day;
            return (
              <button
                key={d}
                type='button'
                aria-pressed={selected}
                onClick={() => select(week, d)}
                className={cn(
                  'flex h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[12px]',
                  !selected && 'border border-mist-line bg-mist-raised',
                  selected &&
                    (week === 2
                      ? 'border-2 border-mist-pink bg-mist-pink/14'
                      : 'border-2 border-mist-cyan-line bg-mist-cyan/14'),
                )}
              >
                <span className='text-[15px] font-extrabold'>Day {d}</span>
                <span className='text-xs font-semibold text-mist-muted'>
                  {title.split(' · ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        <p className='m-0 flex items-start gap-2 px-0.5 pt-0.5 pb-1 text-[13px] leading-[19px] font-medium text-mist-muted'>
          <LinkIcon
            size={16}
            strokeWidth={2}
            aria-hidden
            className='mt-0.5 shrink-0'
          />
          Weight is shared by Week 1 and Week 2. An exercise on two days shares
          one target.
        </p>

        <h2 className='mx-0.5 mt-1 mb-0 text-lg font-extrabold'>
          {DAY_TITLES[day - 1]}
        </h2>

        <RowList rows={dayRows.slice(0, split)} onEdit={setEditingId} />
        {editing && (
          <PlanRowEditor
            key={editing.id}
            row={editing}
            rows={rows}
            planId={plan.id}
            onClose={() => setEditingId(undefined)}
          />
        )}
        <RowList rows={dayRows.slice(split + 1)} onEdit={setEditingId} />
      </main>
    </>
  );
};

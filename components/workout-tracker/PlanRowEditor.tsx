import { LinkIcon, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { idsToSync, PLAN_FIELDS, type PlanField } from '@/lib/workout/planSync';
import { cn } from '@/lib/utils';
import type { PlanRow } from '@/types/workout';
import { useSavePlanRow } from './usePlan';

interface PlanRowEditorProps {
  row: PlanRow;
  /** Every row of the plan, for the sync preview */
  rows: PlanRow[];
  planId: number;
  onClose: () => void;
}

// Limits match PUT /api/workout-tracker/plan
const SETS_MAX = 20;
const REPS_MAX = 9999;

const labelClass =
  'text-[11px] font-bold tracking-[0.08em] text-mist-muted uppercase';
const inputClass =
  'h-12 w-full rounded-[12px] border border-mist-line bg-mist-raised px-3.5 text-mist-text outline-none placeholder:text-mist-muted focus:border-mist-cyan-line focus:ring-1 focus:ring-mist-cyan-line';
const listFormat = new Intl.ListFormat('en-US');

const parseCount = (value: string, max: number) => {
  const n = Number(value);
  return /^\d+$/.test(value) && n >= 1 && n <= max ? n : null;
};

const blankToNull = (value: string) => value.trim() || null;

interface StepperProps {
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
}

const Stepper = ({ label, value, max, onChange }: StepperProps) => {
  const step = (delta: number) =>
    onChange(String(Math.min(max, Math.max(1, Number(value) + delta))));
  const buttonClass =
    'flex cursor-pointer items-center justify-center text-mist-muted';
  return (
    <div className='flex flex-col gap-1.5'>
      <span className={labelClass}>{label}</span>
      <div className='grid h-12 grid-cols-[44px_minmax(0,1fr)_44px] overflow-hidden rounded-[12px] border border-mist-line bg-mist-raised focus-within:border-mist-cyan-line'>
        <button
          type='button'
          aria-label={`Fewer ${label.toLowerCase()}`}
          onClick={() => step(-1)}
          className={buttonClass}
        >
          <Minus size={18} strokeWidth={2.5} aria-hidden />
        </button>
        <input
          aria-label={label}
          value={value}
          inputMode='numeric'
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
          className='min-w-0 bg-transparent text-center font-num text-xl font-bold text-mist-text outline-none'
        />
        <button
          type='button'
          aria-label={`More ${label.toLowerCase()}`}
          onClick={() => step(1)}
          className={buttonClass}
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
};

// Muted: what an edit of the field would reach. Cyan: the field changed.
const SyncHint = ({
  others,
  changed,
}: {
  others: PlanRow[];
  changed: boolean;
}) => (
  <span
    className={cn(
      'flex items-start gap-1.5 text-[13px] leading-[19px]',
      changed ? 'font-semibold text-mist-cyan-text' : 'font-medium',
    )}
  >
    {others.length > 0 && (
      <LinkIcon
        size={14}
        strokeWidth={2.25}
        aria-hidden
        className='mt-[3px] shrink-0'
      />
    )}
    {others.length === 0
      ? 'Only this row.'
      : `${changed ? 'Also updates' : 'Also applies to'} ${listFormat.format(
          others.map((other) => `Week ${other.week} · Day ${other.day}`),
        )}.`}
  </span>
);

const Was = ({ children }: { children: string }) => (
  <span className='shrink-0 text-[13px] font-semibold'>
    was <span className='font-num line-through'>{children}</span>
  </span>
);

export const PlanRowEditor = ({
  row,
  rows,
  planId,
  onClose,
}: PlanRowEditorProps) => {
  const [sets, setSets] = useState(String(row.sets));
  const [reps, setReps] = useState(String(row.reps));
  const [weight, setWeight] = useState(row.weight ?? '');
  const [notes, setNotes] = useState(row.notes ?? '');
  const { mutate, isPending, isError } = useSavePlanRow();

  const edit = {
    sets: parseCount(sets, SETS_MAX),
    reps: parseCount(reps, REPS_MAX),
    weight: blankToNull(weight),
    notes: blankToNull(notes),
  };
  const changed = (field: PlanField) => edit[field] !== row[field];
  const keys = rows.map((other) => ({ ...other, planId }));
  // Includes the edited row itself
  const syncIds = (field: PlanField) =>
    idsToSync(keys, { ...row, planId }, field);
  const others = (field: PlanField) => {
    const ids = syncIds(field);
    return rows.filter(
      (other) => other.id !== row.id && ids.includes(other.id),
    );
  };

  const saveCount = new Set(PLAN_FIELDS.filter(changed).flatMap(syncIds)).size;
  const sameWeekDays = others('sets').map((other) => other.day);
  const setsRepsChanged = changed('sets') || changed('reps');
  const repsLabel = row.isTimed ? 'Seconds' : 'Reps';

  const save = () => {
    if (edit.sets === null || edit.reps === null) return;
    mutate(
      { ...edit, id: row.id, sets: edit.sets, reps: edit.reps },
      { onSuccess: onClose },
    );
  };

  return (
    <section
      aria-label={`Editing ${row.name}`}
      className={cn(
        'flex flex-col gap-3.5 rounded-2xl border bg-mist-surface px-4 pt-3.5 pb-4 text-mist-muted shadow-mist-card',
        row.week === 2 ? 'border-mist-pink' : 'border-mist-cyan-line',
      )}
    >
      <div className='flex items-center gap-3 text-mist-text'>
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full border-2 font-num text-[13px] font-bold',
            row.week === 2
              ? 'border-mist-pink text-mist-pink-text'
              : 'border-mist-cyan-line text-mist-cyan-text',
          )}
        >
          {row.position}
        </span>
        <h3 className='m-0 flex-1 text-lg leading-6 font-extrabold'>
          {row.name}
        </h3>
        {sameWeekDays.length > 0 && (
          <span className='inline-flex shrink-0 items-center gap-1 rounded-full border border-mist-line px-2 py-0.5 text-xs font-bold text-mist-muted'>
            <LinkIcon size={13} strokeWidth={2.25} aria-hidden />
            Also Day {sameWeekDays.join(', ')}
          </span>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <div className='grid grid-cols-2 gap-3'>
          <Stepper
            label='Sets'
            value={sets}
            max={SETS_MAX}
            onChange={setSets}
          />
          <Stepper
            label={repsLabel}
            value={reps}
            max={REPS_MAX}
            onChange={setReps}
          />
        </div>
        <div className='flex items-start justify-between gap-3'>
          <SyncHint others={others('sets')} changed={setsRepsChanged} />
          {setsRepsChanged && <Was>{`${row.sets} × ${row.reps}`}</Was>}
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='plan-weight' className={labelClass}>
          Weight
        </label>
        <div className='flex items-center gap-2.5'>
          <input
            id='plan-weight'
            value={weight}
            maxLength={50}
            placeholder={row.isTimed ? 'Optional' : 'BW'}
            onChange={(event) => setWeight(event.target.value)}
            className={cn(inputClass, 'font-num text-xl font-bold')}
          />
          {changed('weight') && <Was>{row.weight ?? '–'}</Was>}
        </div>
        <SyncHint others={others('weight')} changed={changed('weight')} />
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='plan-notes' className={labelClass}>
          Notes
        </label>
        <input
          id='plan-notes'
          value={notes}
          maxLength={1000}
          placeholder='Optional'
          onChange={(event) => setNotes(event.target.value)}
          className={cn(inputClass, 'text-[15px] font-medium')}
        />
        <SyncHint others={others('notes')} changed={changed('notes')} />
      </div>

      {isError && (
        <p
          role='alert'
          className='m-0 text-[13px] font-semibold text-mist-warn-text'
        >
          Couldn’t save. Try again.
        </p>
      )}

      <div className='mt-0.5 grid grid-cols-[1fr_1.6fr] gap-2'>
        <button
          type='button'
          onClick={onClose}
          className='h-12 cursor-pointer rounded-[12px] border border-mist-line bg-mist-raised text-[15px] font-bold text-mist-text'
        >
          Cancel
        </button>
        <button
          type='button'
          disabled={
            saveCount === 0 ||
            edit.sets === null ||
            edit.reps === null ||
            isPending
          }
          onClick={save}
          className='h-12 cursor-pointer rounded-[12px] bg-mist-cyan text-[15px] font-extrabold text-mist-ink disabled:cursor-default disabled:opacity-50'
        >
          {isPending
            ? 'Saving…'
            : saveCount === 0
            ? 'Save'
            : `Save · ${saveCount} ${saveCount === 1 ? 'row' : 'rows'}`}
        </button>
      </div>
    </section>
  );
};

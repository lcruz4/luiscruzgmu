import { ChevronDown, ChevronUp, LinkIcon, Minus, Plus } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { idsToSync, PLAN_FIELDS, type PlanField } from '@/lib/workout/planSync';
import { cn } from '@/lib/utils';
import type { PlanRow } from '@/types/workout';
import {
  accentBorder,
  badgeClass,
  cardClass,
  labelClass,
  weekText,
} from './styles';
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

const inputClass =
  'h-12 w-full rounded-[12px] border border-mist-line bg-mist-raised px-3.5 text-mist-text outline-none placeholder:text-mist-muted focus:border-mist-cyan-line focus:ring-1 focus:ring-mist-cyan-line';

const parseCount = (value: string, max: number) => {
  const n = Number(value);
  return /^\d+$/.test(value) && n >= 1 && n <= max ? n : null;
};

const blankToNull = (value: string) => value.trim() || null;

interface StepperProps {
  label: string;
  /** Prefix for the accessible names, when two steppers share a label */
  context?: string;
  tag?: ReactNode;
  value: string;
  max: number;
  onChange: (value: string) => void;
}

const Stepper = ({
  label,
  context,
  tag,
  value,
  max,
  onChange,
}: StepperProps) => {
  const name = context ? `${context} ${label.toLowerCase()}` : label;
  const step = (delta: number) =>
    onChange(String(Math.min(max, Math.max(1, Number(value) + delta))));
  const buttonClass =
    'flex cursor-pointer items-center justify-center text-mist-muted';
  return (
    <div className='flex flex-col gap-1.5'>
      <span className='flex items-center gap-2'>
        <span className={labelClass}>{label}</span>
        {tag}
      </span>
      <div className='grid h-12 grid-cols-[44px_minmax(0,1fr)_44px] overflow-hidden rounded-[12px] border border-mist-line bg-mist-raised focus-within:border-mist-cyan-line'>
        <button
          type='button'
          aria-label={`Fewer ${name.toLowerCase()}`}
          onClick={() => step(-1)}
          className={buttonClass}
        >
          <Minus size={18} strokeWidth={2.5} aria-hidden />
        </button>
        <input
          aria-label={name}
          value={value}
          inputMode='numeric'
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
          className='min-w-0 bg-transparent text-center font-num text-xl font-bold text-mist-text outline-none'
        />
        <button
          type='button'
          aria-label={`More ${name.toLowerCase()}`}
          onClick={() => step(1)}
          className={buttonClass}
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
};

// Rows an edit reaches, self included → "Both weeks", "Days 2, 4" or nothing
const shareText = (reached: PlanRow[]) => {
  if (reached.length < 2) return null;
  if (new Set(reached.map((other) => other.week)).size > 1) {
    return 'Both weeks';
  }
  return `Days ${reached.map((other) => other.day).join(', ')}`;
};

// Muted: the field is shared. Cyan: it changed, so the edit reaches them all.
const ShareTag = ({
  reached,
  changed,
}: {
  reached: PlanRow[];
  changed: boolean;
}) => {
  const text = shareText(reached);
  if (!text) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 text-[11px] leading-4 font-bold',
        changed
          ? 'border-mist-cyan-line text-mist-cyan-text'
          : 'border-mist-line text-mist-muted',
      )}
    >
      <LinkIcon size={11} strokeWidth={2.5} aria-hidden />
      {text}
    </span>
  );
};

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

  // Same day first, so a split exercise edits its matching day
  const sameExercise = rows.filter(
    (other) => other.exerciseId === row.exerciseId && other.week !== row.week,
  );
  const otherRow =
    sameExercise.find((other) => other.day === row.day) ?? sameExercise[0];
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherSets, setOtherSets] = useState(String(otherRow?.sets ?? ''));
  const [otherReps, setOtherReps] = useState(String(otherRow?.reps ?? ''));

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
  const reached = (field: PlanField) => {
    const ids = syncIds(field);
    return rows.filter((other) => ids.includes(other.id));
  };
  const tag = (field: PlanField) => (
    <ShareTag reached={reached(field)} changed={changed(field)} />
  );

  const otherEdit = otherRow && {
    id: otherRow.id,
    sets: parseCount(otherSets, SETS_MAX),
    reps: parseCount(otherReps, REPS_MAX),
  };
  const otherFieldChanged = (field: 'sets' | 'reps') =>
    otherEdit !== undefined && otherEdit[field] !== otherRow?.[field];
  const otherChanged = otherFieldChanged('sets') || otherFieldChanged('reps');
  const otherSyncRows = otherRow
    ? rows.filter((other) =>
        idsToSync(keys, { ...otherRow, planId }, 'sets').includes(other.id),
      )
    : [];
  const otherInvalid =
    otherEdit !== undefined &&
    (otherEdit.sets === null || otherEdit.reps === null);

  const saveCount = new Set([
    ...PLAN_FIELDS.filter(changed).flatMap(syncIds),
    ...(otherChanged ? otherSyncRows.map((other) => other.id) : []),
  ]).size;
  const setsRepsChanged = changed('sets') || changed('reps');
  const repsLabel = row.isTimed ? 'Seconds' : 'Reps';

  const save = () => {
    if (edit.sets === null || edit.reps === null) return;
    const otherWeek =
      otherChanged && otherEdit?.sets && otherEdit.reps
        ? { id: otherEdit.id, sets: otherEdit.sets, reps: otherEdit.reps }
        : undefined;
    mutate(
      { ...edit, id: row.id, sets: edit.sets, reps: edit.reps, otherWeek },
      { onSuccess: onClose },
    );
  };

  return (
    <section
      aria-label={`Editing ${row.name}`}
      className={cn(
        cardClass,
        'flex flex-col gap-3.5 px-4 pt-3.5 pb-4 text-mist-muted',
        accentBorder(row.week),
      )}
    >
      <div className='flex items-center gap-3 text-mist-text'>
        <span className={badgeClass(row.week)}>{row.position}</span>
        <h3 className='m-0 flex-1 text-lg leading-6 font-extrabold'>
          {row.name}
        </h3>
      </div>

      <div className='flex flex-col gap-1.5'>
        <div className='grid grid-cols-2 gap-3'>
          <Stepper
            label='Sets'
            tag={tag('sets')}
            value={sets}
            max={SETS_MAX}
            onChange={setSets}
          />
          <Stepper
            label={repsLabel}
            tag={tag('reps')}
            value={reps}
            max={REPS_MAX}
            onChange={setReps}
          />
        </div>
        {setsRepsChanged && (
          <div className='flex justify-end'>
            <Was>{`${row.sets} × ${row.reps}`}</Was>
          </div>
        )}
      </div>

      {otherRow &&
        (otherOpen ? (
          <div
            className={cn(
              'flex flex-col gap-1.5 rounded-[12px] border border-dashed p-3',
              accentBorder(otherRow.week),
            )}
          >
            <button
              type='button'
              aria-expanded
              onClick={() => setOtherOpen(false)}
              className={cn(
                'flex cursor-pointer items-center justify-between text-[13px] font-bold',
                weekText(otherRow.week),
              )}
            >
              Week {otherRow.week}
              <ChevronUp size={16} strokeWidth={2.5} aria-hidden />
            </button>
            <div className='grid grid-cols-2 gap-3'>
              <Stepper
                label='Sets'
                context={`Week ${otherRow.week}`}
                tag={
                  <ShareTag
                    reached={otherSyncRows}
                    changed={otherFieldChanged('sets')}
                  />
                }
                value={otherSets}
                max={SETS_MAX}
                onChange={setOtherSets}
              />
              <Stepper
                label={repsLabel}
                context={`Week ${otherRow.week}`}
                tag={
                  <ShareTag
                    reached={otherSyncRows}
                    changed={otherFieldChanged('reps')}
                  />
                }
                value={otherReps}
                max={REPS_MAX}
                onChange={setOtherReps}
              />
            </div>
            {otherChanged && (
              <div className='flex justify-end'>
                <Was>{`${otherRow.sets} × ${otherRow.reps}`}</Was>
              </div>
            )}
          </div>
        ) : (
          <button
            type='button'
            aria-expanded={false}
            onClick={() => setOtherOpen(true)}
            className={cn(
              'flex h-11 cursor-pointer items-center justify-between rounded-[12px] border border-dashed px-3 text-[13px] font-bold',
              accentBorder(otherRow.week),
              weekText(otherRow.week),
            )}
          >
            <span>
              Week {otherRow.week} ·{' '}
              <span className='font-num'>{`${otherRow.sets} × ${otherRow.reps}`}</span>
            </span>
            <span className='flex items-center gap-1'>
              Edit
              <ChevronDown size={16} strokeWidth={2.5} aria-hidden />
            </span>
          </button>
        ))}

      <div className='flex flex-col gap-1.5'>
        <span className='flex items-center gap-2'>
          <label htmlFor='plan-weight' className={labelClass}>
            Weight
          </label>
          {tag('weight')}
        </span>
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
      </div>

      <div className='flex flex-col gap-1.5'>
        <span className='flex items-center gap-2'>
          <label htmlFor='plan-notes' className={labelClass}>
            Notes
          </label>
          {tag('notes')}
        </span>
        <input
          id='plan-notes'
          value={notes}
          maxLength={1000}
          placeholder='Optional'
          onChange={(event) => setNotes(event.target.value)}
          className={cn(inputClass, 'text-[15px] font-medium')}
        />
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
            otherInvalid ||
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

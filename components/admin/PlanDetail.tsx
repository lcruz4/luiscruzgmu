import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Check,
  Loader2,
  Lock,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';
import { DAYS_PER_WEEK, WEEKS } from '@/lib/workout/schedule';
import type { AdminPlanDetailRow, AdminPlanSummary } from '@/types/workout';
import {
  ConfirmButton,
  ErrorText,
  GHOST_BTN,
  INPUT,
  LABEL,
  OUTLINE_ACCENT,
  OUTLINE_DANGER,
} from './ui';
import {
  type PlanRowInput,
  useCreatePlanRow,
  useDeletePlan,
  useDeletePlanRow,
  useExercises,
  usePlan,
  useSetPlanActive,
  useUpdatePlanRow,
} from './workoutApi';

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const CELL = 'px-3 py-2 align-middle';
// 0 sets/reps = not filled in yet
const shown = (value: number | string | null) =>
  value ? value : <span className='text-[#4b5a7d]'>—</span>;

const Picker = ({
  label,
  count,
  value,
  onChange,
}: {
  label: string;
  count: number;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className='flex items-center gap-1.5'>
    <span className={`${LABEL} mr-1`}>{label}</span>
    {range(count).map((n) => (
      <button
        key={n}
        type='button'
        onClick={() => onChange(n)}
        className={`size-6 rounded border font-mono text-xs ${
          n === value
            ? 'border-[#22d3ee55] bg-[#22d3ee1a] text-[#67e8f9]'
            : 'border-[#1e2a44] text-[#7b8bb0] hover:text-[#d6e2ff]'
        }`}
      >
        {n}
      </button>
    ))}
  </div>
);

const numberInput = (value: string) => (value === '' ? 0 : Number(value));

const RowEditor = ({
  initial,
  pending,
  error,
  onSave,
  onCancel,
}: {
  initial: PlanRowInput;
  pending: boolean;
  error: Error | null;
  onSave: (row: PlanRowInput) => void;
  onCancel: () => void;
}) => {
  const { data: exercises = [] } = useExercises();
  const [row, setRow] = useState(initial);
  const formId = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(row);
  };

  return (
    <tr className='border-t border-[#22d3ee55] bg-[#22d3ee0a]'>
      <td className={CELL}>
        <input
          form={formId}
          type='number'
          min={1}
          value={row.position}
          onChange={(e) =>
            setRow({ ...row, position: numberInput(e.target.value) })
          }
          className={`${INPUT} h-7 w-12 px-1 font-mono text-xs`}
        />
      </td>
      <td className={CELL}>
        <select
          form={formId}
          required
          value={row.exerciseId || ''}
          onChange={(e) =>
            setRow({ ...row, exerciseId: Number(e.target.value) })
          }
          className={`${INPUT} h-7 w-full text-xs`}
        >
          <option value=''>Exercise</option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
              {exercise.isTimed ? ' (timed)' : ''}
            </option>
          ))}
        </select>
        <input
          form={formId}
          placeholder='Notes'
          value={row.notes ?? ''}
          onChange={(e) => setRow({ ...row, notes: e.target.value })}
          className={`${INPUT} mt-1 h-7 w-full text-xs`}
        />
        <ErrorText error={error} />
      </td>
      {(['sets', 'reps'] as const).map((field) => (
        <td key={field} className={`${CELL} align-top`}>
          <input
            form={formId}
            type='number'
            min={0}
            value={row[field] || ''}
            placeholder='—'
            onChange={(e) =>
              setRow({ ...row, [field]: numberInput(e.target.value) })
            }
            className={`${INPUT} h-7 w-14 px-1 font-mono text-xs`}
          />
        </td>
      ))}
      <td className={`${CELL} align-top`}>
        <input
          form={formId}
          value={row.weight ?? ''}
          placeholder='—'
          onChange={(e) => setRow({ ...row, weight: e.target.value })}
          className={`${INPUT} h-7 w-20 px-1 font-mono text-xs`}
        />
      </td>
      <td className={`${CELL} align-top text-right`}>
        <form
          id={formId}
          onSubmit={submit}
          className='inline-flex items-center gap-1'
        >
          <button
            type='submit'
            aria-label='Save'
            disabled={pending}
            className='rounded p-1 text-[#22d3ee] hover:bg-[#22d3ee1a]'
          >
            {pending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Check className='size-4' />
            )}
          </button>
          <button
            type='button'
            aria-label='Cancel'
            onClick={onCancel}
            className='rounded p-1 text-[#7b8bb0] hover:bg-[#ffffff0d]'
          >
            <X className='size-4' />
          </button>
        </form>
      </td>
    </tr>
  );
};

const rowInput = (row: AdminPlanDetailRow): PlanRowInput => ({
  week: row.week,
  day: row.day,
  position: row.position,
  exerciseId: row.exerciseId,
  sets: row.sets,
  reps: row.reps,
  weight: row.weight,
  notes: row.notes,
});

const PlanRow = ({ row }: { row: AdminPlanDetailRow }) => {
  const update = useUpdatePlanRow(row.id);
  const remove = useDeletePlanRow(row.id);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <RowEditor
        initial={rowInput(row)}
        pending={update.isPending}
        error={update.error}
        onSave={(input) =>
          update.mutate(input, { onSuccess: () => setEditing(false) })
        }
        onCancel={() => {
          setEditing(false);
          update.reset();
        }}
      />
    );
  }

  return (
    <tr className='border-t border-[#1e2a44] hover:bg-[#ffffff05]'>
      <td className={`${CELL} font-mono text-xs text-[#4b5a7d]`}>
        {row.position}
      </td>
      <td className={CELL}>
        {row.name}
        {row.notes && (
          <p className='text-xs text-[#4b5a7d]' title={row.notes}>
            {row.notes}
          </p>
        )}
      </td>
      <td className={`${CELL} font-mono text-xs`}>{shown(row.sets)}</td>
      <td className={`${CELL} font-mono text-xs`}>
        {shown(row.reps)}
        {row.isTimed && row.reps ? 's' : ''}
      </td>
      <td className={`${CELL} font-mono text-xs`}>{shown(row.weight)}</td>
      <td className={`${CELL} text-right`}>
        <div className='inline-flex items-start gap-1'>
          <button
            type='button'
            aria-label='Edit'
            onClick={() => setEditing(true)}
            className={`${GHOST_BTN} h-7 border-transparent px-1.5 text-[#7b8bb0] hover:text-[#67e8f9]`}
          >
            <Pencil className='size-3.5' />
          </button>
          {row.hasLogs ? (
            <span
              title='Has logged workouts, so it can’t be deleted'
              className='inline-flex h-7 items-center px-1.5 text-[#4b5a7d]'
            >
              <Lock className='size-3.5' />
            </span>
          ) : (
            <ConfirmButton
              icon={<Trash2 className='size-3.5' />}
              label=''
              confirmLabel='Confirm'
              onConfirm={() => remove.mutate()}
              pending={remove.isPending}
              error={remove.error}
            />
          )}
        </div>
      </td>
    </tr>
  );
};

const ActiveToggle = ({
  planId,
  isActive,
  otherActive,
}: {
  planId: number;
  isActive: boolean;
  otherActive: AdminPlanSummary | undefined;
}) => {
  const setActive = useSetPlanActive(planId);
  if (isActive) {
    return (
      <ConfirmButton
        icon={<ToggleRight className='size-3.5' />}
        label='Active'
        confirmLabel='Deactivate'
        tone='accent'
        idle={OUTLINE_ACCENT}
        onConfirm={() => setActive.mutate(false)}
        pending={setActive.isPending}
        error={setActive.error}
      />
    );
  }
  return (
    <ConfirmButton
      icon={<ToggleLeft className='size-3.5' />}
      label='Activate'
      confirmLabel={`Deactivates #${otherActive?.id}`}
      tone='accent'
      confirm={!!otherActive}
      onConfirm={() => setActive.mutate(true)}
      pending={setActive.isPending}
      error={setActive.error}
    />
  );
};

export const PlanDetail = ({
  planId,
  plans,
  onDeleted,
}: {
  planId: number;
  plans: AdminPlanSummary[];
  onDeleted: () => void;
}) => {
  const { data, isPending, error } = usePlan(planId);
  const remove = useDeletePlan();
  const createRow = useCreatePlanRow(planId);
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(1);
  const [adding, setAdding] = useState(false);

  if (isPending || error) {
    return (
      <p
        className={`flex items-center gap-2 px-4 py-6 font-mono text-xs ${
          error ? 'text-[#f472b6]' : 'text-[#7b8bb0]'
        }`}
      >
        {error ? (
          error.message
        ) : (
          <>
            <Loader2 className='size-3.5 animate-spin' /> Loading plan…
          </>
        )}
      </p>
    );
  }

  const { plan, rows } = data;
  const dayRows = rows.filter((row) => row.week === week && row.day === day);
  const otherActive = plans.find(
    (other) =>
      other.ownerEmail === plan.ownerEmail &&
      other.isActive &&
      other.id !== plan.id,
  );
  const hasLogs = rows.some((row) => row.hasLogs);
  const nextPosition = Math.max(0, ...dayRows.map((row) => row.position)) + 1;

  return (
    <>
      <div className='flex flex-wrap items-center gap-3 border-b border-[#1e2a44] px-4 py-3'>
        <div className='min-w-0'>
          <h2 className='font-semibold'>
            {plan.name}{' '}
            <span className='font-mono text-xs font-normal text-[#4b5a7d]'>
              #{plan.id}
            </span>
          </h2>
          <p className='font-mono text-xs text-[#7b8bb0]'>{plan.ownerEmail}</p>
        </div>
        <div className='ml-auto flex items-start gap-2'>
          <ActiveToggle
            planId={plan.id}
            isActive={plan.isActive}
            otherActive={otherActive}
          />
          {hasLogs ? (
            <span
              title='Has logged workouts; deactivate it instead'
              className={`${GHOST_BTN} cursor-not-allowed border-[#1e2a44] text-[#4b5a7d]`}
            >
              <Lock className='size-3.5' />
              Delete
            </span>
          ) : (
            <ConfirmButton
              icon={<Trash2 className='size-3.5' />}
              label='Delete'
              confirmLabel='Confirm'
              idle={OUTLINE_DANGER}
              onConfirm={() => remove.mutate(plan.id, { onSuccess: onDeleted })}
              pending={remove.isPending}
              error={remove.error}
            />
          )}
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3'>
        <Picker label='WEEK' count={WEEKS} value={week} onChange={setWeek} />
        <Picker
          label='DAY'
          count={DAYS_PER_WEEK}
          value={day}
          onChange={setDay}
        />
      </div>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[40rem] table-fixed text-left text-sm'>
          <thead>
            <tr className={LABEL}>
              <th className='w-16 px-3 py-2 font-normal'>#</th>
              <th className='px-3 py-2 font-normal'>EXERCISE</th>
              <th className='w-20 px-3 py-2 font-normal'>SETS</th>
              <th className='w-20 px-3 py-2 font-normal'>REPS</th>
              <th className='w-28 px-3 py-2 font-normal'>WEIGHT</th>
              <th className='w-32 px-3 py-2' />
            </tr>
          </thead>
          <tbody>
            {dayRows.map((row) => (
              <PlanRow key={row.id} row={row} />
            ))}
            {adding && (
              <RowEditor
                initial={{
                  week,
                  day,
                  position: nextPosition,
                  exerciseId: 0,
                  sets: 0,
                  reps: 0,
                  weight: null,
                  notes: null,
                }}
                pending={createRow.isPending}
                error={createRow.error}
                onSave={(input) =>
                  createRow.mutate(input, { onSuccess: () => setAdding(false) })
                }
                onCancel={() => {
                  setAdding(false);
                  createRow.reset();
                }}
              />
            )}
          </tbody>
        </table>
      </div>
      <div className='border-t border-[#1e2a44] px-4 py-3'>
        <button
          type='button'
          disabled={adding}
          onClick={() => setAdding(true)}
          className={`${GHOST_BTN} border-dashed border-[#2b3a5c] text-[#7b8bb0] hover:border-[#22d3ee] hover:text-[#67e8f9]`}
        >
          <Plus className='size-3.5' />
          Add exercise
        </button>
      </div>
    </>
  );
};

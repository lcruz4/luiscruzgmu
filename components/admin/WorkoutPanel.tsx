import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import type { AdminPlanSummary } from '@/types/workout';
import { useUsersWithApp } from './api';
import { PlanDetail } from './PlanDetail';
import { ErrorText, INPUT, LABEL, PRIMARY_BTN, SECONDARY_BTN } from './ui';
import { type NewPlan, useCreatePlan, usePlans } from './workoutApi';

const PANEL = 'rounded-lg border border-[#1e2a44] bg-[#111829]';

const byOwner = (plans: AdminPlanSummary[]) => {
  const groups = new Map<string, AdminPlanSummary[]>();
  for (const plan of plans) {
    groups.set(plan.ownerEmail, [...(groups.get(plan.ownerEmail) ?? []), plan]);
  }
  return [...groups];
};

const PlanList = ({
  plans,
  selectedId,
  onSelect,
  onNew,
}: {
  plans: AdminPlanSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
}) => (
  <aside className={`${PANEL} self-start lg:max-h-full lg:overflow-y-auto`}>
    <div className='flex items-center border-b border-[#1e2a44] px-4 py-3'>
      <h2 className='font-mono text-xs tracking-[0.2em] text-[#7b8bb0]'>
        PLANS <span className='text-[#22d3ee]'>· {plans.length}</span>
      </h2>
      <button
        type='button'
        onClick={onNew}
        className={`${PRIMARY_BTN} ml-auto`}
      >
        <Plus className='size-3.5' />
        New
      </button>
    </div>
    <div className='py-2'>
      {byOwner(plans).map(([owner, ownerPlans]) => (
        <div key={owner} className='px-2 pb-2'>
          <p className='px-2 py-1 font-mono text-xs text-[#7b8bb0]'>{owner}</p>
          {ownerPlans.map((plan) => (
            <button
              key={plan.id}
              type='button'
              onClick={() => onSelect(plan.id)}
              className={`block w-full rounded border px-2 py-1.5 text-left text-sm ${
                plan.id === selectedId
                  ? 'border-[#22d3ee55] bg-[#22d3ee1a]'
                  : 'border-transparent hover:bg-[#ffffff05]'
              }`}
            >
              <span className='flex items-center justify-between gap-2'>
                <span
                  className={
                    plan.id === selectedId
                      ? 'text-[#67e8f9]'
                      : plan.isActive
                      ? 'text-[#d6e2ff]'
                      : 'text-[#7b8bb0]'
                  }
                >
                  {plan.name}
                </span>
                {plan.isActive ? (
                  <span className='rounded bg-[#22d3ee1a] px-1.5 font-mono text-[11px] text-[#67e8f9]'>
                    ACTIVE
                  </span>
                ) : (
                  <span className='rounded border border-[#1e2a44] px-1.5 font-mono text-[11px] text-[#4b5a7d]'>
                    OFF
                  </span>
                )}
              </span>
              <span className='font-mono text-[11px] text-[#4b5a7d]'>
                #{plan.id} · {plan.exerciseCount} rows
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  </aside>
);

const NewPlanForm = ({
  plans,
  onCreated,
  onCancel,
}: {
  plans: AdminPlanSummary[];
  onCreated: (id: number) => void;
  onCancel: () => void;
}) => {
  const owners = useUsersWithApp('workout-tracker');
  const create = useCreatePlan();
  const [plan, setPlan] = useState<NewPlan>({
    ownerEmail: '',
    name: '',
    sourcePlanId: null,
    blank: true,
    activate: false,
  });
  const ownerActive = plans.find(
    (other) => other.ownerEmail === plan.ownerEmail && other.isActive,
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      { ...plan, name: plan.name.trim() },
      { onSuccess: (created) => onCreated(created.plan.id) },
    );
  };

  return (
    <form
      onSubmit={submit}
      className='rounded-lg border border-[#22d3ee55] bg-[#22d3ee0a] p-4'
    >
      <h2 className={`${LABEL} mb-3`}>NEW PLAN</h2>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <label className='flex flex-col gap-1'>
          <span className={LABEL}>OWNER</span>
          <select
            required
            value={plan.ownerEmail}
            onChange={(e) => setPlan({ ...plan, ownerEmail: e.target.value })}
            className={`${INPUT} min-w-0 font-mono`}
          >
            <option value=''>Choose a user</option>
            {owners.map((user) => (
              <option key={user.email} value={user.email}>
                {user.email}
              </option>
            ))}
          </select>
        </label>
        <label className='flex flex-col gap-1'>
          <span className={LABEL}>NAME</span>
          <input
            required
            placeholder='2 Week Workout'
            value={plan.name}
            onChange={(e) => setPlan({ ...plan, name: e.target.value })}
            className={INPUT}
          />
        </label>
        <label className='flex flex-col gap-1'>
          <span className={LABEL}>COPY FROM</span>
          <select
            value={plan.sourcePlanId ?? ''}
            onChange={(e) => {
              const source = plans.find(
                ({ id }) => id === Number(e.target.value),
              );
              const previous = plans.find(({ id }) => id === plan.sourcePlanId);
              // Fill an empty name, or one still matching the last source
              const autofill =
                !plan.name.trim() || plan.name === previous?.name;
              setPlan({
                ...plan,
                sourcePlanId: source?.id ?? null,
                name: autofill ? source?.name ?? '' : plan.name,
              });
            }}
            className={`${INPUT} min-w-0`}
          >
            <option value=''>Empty plan</option>
            {plans.map((source) => (
              <option key={source.id} value={source.id}>
                #{source.id} {source.name} · {source.ownerEmail}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className='mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#7b8bb0]'>
        <label className='flex items-center gap-2'>
          <input
            type='checkbox'
            disabled={plan.sourcePlanId === null}
            checked={plan.blank}
            onChange={(e) => setPlan({ ...plan, blank: e.target.checked })}
            className='accent-[#22d3ee]'
          />
          Blank sets, reps, weight, notes
        </label>
        <label className='flex items-center gap-2'>
          <input
            type='checkbox'
            checked={plan.activate}
            onChange={(e) => setPlan({ ...plan, activate: e.target.checked })}
            className='accent-[#22d3ee]'
          />
          Activate
          {plan.activate && ownerActive && (
            <span className='text-xs text-[#fbbf24]'>
              deactivates #{ownerActive.id} {ownerActive.name}
            </span>
          )}
        </label>
        <div className='ml-auto flex items-center gap-2'>
          <button
            type='submit'
            disabled={create.isPending}
            className={PRIMARY_BTN}
          >
            {create.isPending ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <Check className='size-3.5' />
            )}
            Create
          </button>
          <button type='button' onClick={onCancel} className={SECONDARY_BTN}>
            Cancel
          </button>
        </div>
      </div>
      <ErrorText error={create.error} />
    </form>
  );
};

export const WorkoutPanel = () => {
  const { data: plans = [], isPending, error } = usePlans();
  const [picked, setPicked] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  // Remounts the form so it opens empty
  const [formKey, setFormKey] = useState(0);
  const closeForm = () => {
    setAdding(false);
    setFormKey((key) => key + 1);
  };
  const selectedId =
    plans.find((plan) => plan.id === picked)?.id ?? plans.at(0)?.id ?? null;

  if (isPending || error) {
    return (
      <p
        className={`flex items-center gap-2 font-mono text-xs ${
          error ? 'text-[#f472b6]' : 'text-[#7b8bb0]'
        }`}
      >
        {error ? (
          error.message
        ) : (
          <>
            <Loader2 className='size-3.5 animate-spin' /> Loading plans…
          </>
        )}
      </p>
    );
  }

  // Desktop: fills the viewport, and the new plan form rises from the bottom
  // while the grid shrinks to make room. Stacked, the form opens on top so
  // it shows up next to the New button
  return (
    <div className='flex flex-col lg:h-[calc(100vh-12rem)]'>
      <div className='grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[18rem_minmax(0,1fr)]'>
        <PlanList
          plans={plans}
          selectedId={selectedId}
          onSelect={setPicked}
          onNew={() => setAdding(true)}
        />
        <section className={`${PANEL} overflow-hidden lg:overflow-y-auto`}>
          {selectedId === null ? (
            <p className='px-4 py-16 text-center font-mono text-xs text-[#4b5a7d]'>
              No plans yet
            </p>
          ) : (
            <PlanDetail
              key={selectedId}
              planId={selectedId}
              plans={plans}
              onDeleted={() => setPicked(null)}
            />
          )}
        </section>
      </div>
      <div
        className={`order-first grid shrink-0 lg:order-none lg:transition-[grid-template-rows] lg:duration-300 lg:ease-out ${
          adding ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        {/* invisible once closed keeps the hidden form out of tab order */}
        <div
          className={`min-h-0 overflow-hidden transition-[visibility] duration-300 ${
            adding ? 'visible' : 'invisible'
          }`}
        >
          <div
            className={`pb-4 lg:pt-4 lg:pb-0 lg:transition-transform lg:duration-300 lg:ease-out ${
              adding ? 'translate-y-0' : 'lg:translate-y-full'
            }`}
          >
            <NewPlanForm
              key={formKey}
              plans={plans}
              onCreated={(id) => {
                setPicked(id);
                closeForm();
              }}
              onCancel={closeForm}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

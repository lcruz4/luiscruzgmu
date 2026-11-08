import type { PoolClient } from 'pg';
import { MAX_WEEKS } from '@/lib/workout/schedule';
import { HttpError, idField, intField, textField } from './workoutApi';
import { workoutPool } from './workoutDb';
import type {
  AdminPlan,
  AdminPlanDetailRow,
  AdminPlanResponse,
  AdminPlanRow,
} from '@/types/workout';

export const getAdminPlan = async (
  db: PoolClient | typeof workoutPool,
  planId: number,
): Promise<AdminPlanResponse> => {
  const { rows } = await db.query<AdminPlan>(
    `SELECT id, name, weeks, day_titles AS "dayTitles", owner_email AS "ownerEmail", is_active AS "isActive"
     FROM plans
     WHERE id = $1`,
    [planId],
  );
  const plan = rows.at(0);
  if (!plan) throw new HttpError(404, 'Plan not found');
  // hasLogs: logs reference the row, so it can't be deleted
  const { rows: planRows } = await db.query<AdminPlanDetailRow>(
    `SELECT pe.id, pe.week, pe.day, pe.position,
       pe.exercise_id AS "exerciseId", e.name, e.is_timed AS "isTimed",
       pe.sets, pe.reps, pe.weight, pe.notes,
       EXISTS (SELECT 1 FROM workout_log wl WHERE wl.plan_exercise_id = pe.id)
         AS "hasLogs"
     FROM plan_exercises pe
     JOIN exercises e ON e.id = pe.exercise_id
     WHERE pe.plan_id = $1
     ORDER BY pe.week, pe.day, pe.position`,
    [planId],
  );
  return { plan, rows: planRows };
};

export const getAdminPlanRow = async (
  db: PoolClient | typeof workoutPool,
  id: number,
): Promise<AdminPlanRow> => {
  const { rows } = await db.query<AdminPlanRow>(
    `SELECT pe.id, pe.plan_id AS "planId", pe.week, pe.day, pe.position,
       pe.exercise_id AS "exerciseId", e.name, e.is_timed AS "isTimed",
       pe.sets, pe.reps, pe.weight, pe.notes
     FROM plan_exercises pe
     JOIN exercises e ON e.id = pe.exercise_id
     WHERE pe.id = $1`,
    [id],
  );
  const row = rows.at(0);
  if (!row) throw new HttpError(404, 'Plan exercise not found');
  return row;
};

// Body fields of a plan_exercises row. 0 sets/reps = not filled in yet.
export const planRowFields = (body: Record<string, unknown>) => ({
  week: intField(body.week, 'week', 1, MAX_WEEKS),
  day: intField(body.day, 'day', 1, 7),
  position: intField(body.position, 'position', 1, 100),
  exerciseId: idField(body.exerciseId, 'exerciseId'),
  sets: intField(body.sets, 'sets', 0, 20),
  reps: intField(body.reps, 'reps', 0, 9999),
  weight: textField(body.weight, 'weight', 50),
  notes: textField(body.notes, 'notes', 1000),
});

// One active plan per owner, so activating a plan deactivates the others
export const deactivateOwnerPlans = async (
  client: PoolClient,
  ownerEmail: string,
) => {
  await client.query(
    'UPDATE plans SET is_active = false WHERE owner_email = $1 AND is_active',
    [ownerEmail],
  );
};

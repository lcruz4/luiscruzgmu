import type { PoolClient } from 'pg';
import { HttpError, idField, intField, textField } from './workoutApi';
import { getPlanRows, workoutPool } from './workoutDb';
import type {
  AdminPlan,
  AdminPlanResponse,
  AdminPlanRow,
} from '@/types/workout';

export const ADMIN_PLAN_SELECT = `
  SELECT id, name, owner_email AS "ownerEmail", is_active AS "isActive"
  FROM plans`;

export const getAdminPlan = async (
  db: PoolClient | typeof workoutPool,
  planId: number,
): Promise<AdminPlanResponse> => {
  const { rows } = await db.query<AdminPlan>(
    `${ADMIN_PLAN_SELECT} WHERE id = $1`,
    [planId],
  );
  const plan = rows.at(0);
  if (!plan) throw new HttpError(404, 'Plan not found');
  return { plan, rows: await getPlanRows(db, planId) };
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
  week: intField(body.week, 'week', 1, 52),
  day: intField(body.day, 'day', 1, 7),
  position: intField(body.position, 'position', 1, 100),
  exerciseId: idField(body.exerciseId, 'exerciseId'),
  sets: intField(body.sets, 'sets', 0, 20),
  reps: intField(body.reps, 'reps', 0, 9999),
  weight: textField(body.weight, 'weight', 50),
  notes: textField(body.notes, 'notes', 1000),
});

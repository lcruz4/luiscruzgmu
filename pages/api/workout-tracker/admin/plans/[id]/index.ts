import type { NextApiRequest } from 'next';
import { MAX_WEEKS } from '@/lib/workout/schedule';
import {
  bodyOf,
  HttpError,
  idField,
  intField,
  workoutAdminRoute,
} from '@/services/workoutApi';
import { getAdminPlan } from '@/services/workoutAdminDb';
import { withTransaction, workoutPool } from '@/services/workoutDb';
import type { AdminPlanResponse } from '@/types/workout';

const getPlan = async (req: NextApiRequest): Promise<AdminPlanResponse> =>
  getAdminPlan(workoutPool, idField(req.query.id, 'id'));

// Body: { weeks }. Refuses to drop a week that still has rows.
const updatePlan = async (req: NextApiRequest): Promise<AdminPlanResponse> => {
  const id = idField(req.query.id, 'id');
  const weeks = intField(bodyOf(req).weeks, 'weeks', 1, MAX_WEEKS);

  return withTransaction(async (client) => {
    const { rowCount } = await client.query(
      'SELECT 1 FROM plans WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!rowCount) throw new HttpError(404, 'Plan not found');
    const { rowCount: dropped } = await client.query(
      'SELECT 1 FROM plan_exercises WHERE plan_id = $1 AND week > $2 LIMIT 1',
      [id, weeks],
    );
    if (dropped) {
      throw new HttpError(
        409,
        `Plan has exercises after week ${weeks}; delete them first`,
      );
    }
    await client.query('UPDATE plans SET weeks = $2 WHERE id = $1', [
      id,
      weeks,
    ]);
    return getAdminPlan(client, id);
  });
};

// Logs reference plan_exercises, so a plan with logged workouts is kept
// (deactivate it instead) rather than wiping the owner's history.
const deletePlan = async (req: NextApiRequest): Promise<{ id: number }> => {
  const id = idField(req.query.id, 'id');

  return withTransaction(async (client) => {
    const { rowCount } = await client.query(
      'SELECT 1 FROM plans WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!rowCount) throw new HttpError(404, 'Plan not found');
    const { rowCount: logCount } = await client.query(
      `SELECT 1
       FROM workout_log wl
       JOIN plan_exercises pe ON pe.id = wl.plan_exercise_id
       WHERE pe.plan_id = $1
       LIMIT 1`,
      [id],
    );
    if (logCount) {
      throw new HttpError(
        409,
        'Plan has logged workouts; deactivate it instead',
      );
    }
    await client.query('DELETE FROM plan_exercises WHERE plan_id = $1', [id]);
    await client.query('DELETE FROM plans WHERE id = $1', [id]);
    return { id };
  });
};

export default workoutAdminRoute({
  GET: getPlan,
  PATCH: updatePlan,
  DELETE: deletePlan,
});

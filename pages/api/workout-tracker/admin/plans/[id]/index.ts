import type { NextApiRequest } from 'next';
import { HttpError, idField, workoutAdminRoute } from '@/services/workoutApi';
import { getAdminPlan } from '@/services/workoutAdminDb';
import { withTransaction, workoutPool } from '@/services/workoutDb';
import type { AdminPlanResponse } from '@/types/workout';

const getPlan = async (req: NextApiRequest): Promise<AdminPlanResponse> =>
  getAdminPlan(workoutPool, idField(req.query.id, 'id'));

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

export default workoutAdminRoute({ GET: getPlan, DELETE: deletePlan });

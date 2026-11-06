import type { NextApiRequest } from 'next';
import { bodyOf, idField, workoutAdminRoute } from '@/services/workoutApi';
import { getAdminPlanRow, planRowFields } from '@/services/workoutAdminDb';
import { workoutPool } from '@/services/workoutDb';
import type { AdminPlanRow } from '@/types/workout';

// Body: { planId, week, day, position, exerciseId, sets, reps, weight, notes }
const createRow = async (req: NextApiRequest): Promise<AdminPlanRow> => {
  const body = bodyOf(req);
  const planId = idField(body.planId, 'planId');
  const row = planRowFields(body);
  const { rows } = await workoutPool.query<{ id: number }>(
    `INSERT INTO plan_exercises
       (plan_id, week, day, position, exercise_id, sets, reps, weight, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      planId,
      row.week,
      row.day,
      row.position,
      row.exerciseId,
      row.sets,
      row.reps,
      row.weight,
      row.notes,
    ],
  );
  return getAdminPlanRow(workoutPool, rows[0].id);
};

export default workoutAdminRoute({ POST: createRow });

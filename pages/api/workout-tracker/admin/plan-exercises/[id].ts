import type { NextApiRequest } from 'next';
import {
  bodyOf,
  HttpError,
  idField,
  workoutAdminRoute,
} from '@/services/workoutApi';
import { getAdminPlanRow, planRowFields } from '@/services/workoutAdminDb';
import { workoutPool } from '@/services/workoutDb';
import type { AdminPlanRow } from '@/types/workout';

const getRow = async (req: NextApiRequest): Promise<AdminPlanRow> =>
  getAdminPlanRow(workoutPool, idField(req.query.id, 'id'));

// Body: { week, day, position, exerciseId, sets, reps, weight, notes }
const putRow = async (req: NextApiRequest): Promise<AdminPlanRow> => {
  const id = idField(req.query.id, 'id');
  const row = planRowFields(bodyOf(req));
  const { rowCount } = await workoutPool.query(
    `UPDATE plan_exercises
     SET week = $2, day = $3, position = $4, exercise_id = $5,
       sets = $6, reps = $7, weight = $8, notes = $9
     WHERE id = $1`,
    [
      id,
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
  if (!rowCount) throw new HttpError(404, 'Plan exercise not found');
  return getAdminPlanRow(workoutPool, id);
};

// A row with logs can't be deleted (409 from the foreign key)
const deleteRow = async (req: NextApiRequest): Promise<{ id: number }> => {
  const id = idField(req.query.id, 'id');
  const { rowCount } = await workoutPool.query(
    'DELETE FROM plan_exercises WHERE id = $1',
    [id],
  );
  if (!rowCount) throw new HttpError(404, 'Plan exercise not found');
  return { id };
};

export default workoutAdminRoute({
  GET: getRow,
  PUT: putRow,
  DELETE: deleteRow,
});

import type { NextApiRequest } from 'next';
import {
  bodyOf,
  dateField,
  HttpError,
  idField,
  intField,
  nullableIntField,
  textField,
  workoutRoute,
} from '@/services/workoutApi';
import {
  getOwnedPlanExercise,
  loadOrPruneLog,
  withTransaction,
} from '@/services/workoutDb';
import type { LogResponse } from '@/types/workout';

const MAX_SETS = 20;

// Body: { planExerciseId, date, setNumber, weight, reps, notes }. Upserts the
// set, creating that day's log if needed. Reps are seconds for timed exercises.
const putSet = async (
  req: NextApiRequest,
  email: string,
): Promise<LogResponse> => {
  const body = bodyOf(req);
  const planExerciseId = idField(body.planExerciseId, 'planExerciseId');
  const date = dateField(body.date);
  const setNumber = intField(body.setNumber, 'setNumber', 1, MAX_SETS);
  const weight = textField(body.weight, 'weight', 50);
  const reps = nullableIntField(body.reps, 'reps', 0, 9999);
  const notes = textField(body.notes, 'notes', 1000);

  return withTransaction(async (client) => {
    await getOwnedPlanExercise(client, email, planExerciseId);
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO workout_log (plan_exercise_id, date) VALUES ($1, $2)
       ON CONFLICT (plan_exercise_id, date) DO UPDATE SET updated_at = now()
       RETURNING id`,
      [planExerciseId, date],
    );
    const logId = rows[0].id;
    await client.query(
      `INSERT INTO workout_log_sets (workout_log_id, set_number, weight, reps, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (workout_log_id, set_number)
       DO UPDATE SET weight = EXCLUDED.weight, reps = EXCLUDED.reps, notes = EXCLUDED.notes`,
      [logId, setNumber, weight, reps, notes],
    );
    return { log: await loadOrPruneLog(client, logId) };
  });
};

// ?planExerciseId=&date=&setNumber=. Later sets move up one so numbers stay
// 1..n; an emptied log is deleted.
const deleteSet = async (
  req: NextApiRequest,
  email: string,
): Promise<LogResponse> => {
  const planExerciseId = idField(req.query.planExerciseId, 'planExerciseId');
  const date = dateField(req.query.date);
  const setNumber = intField(req.query.setNumber, 'setNumber', 1, MAX_SETS);

  return withTransaction(async (client) => {
    await getOwnedPlanExercise(client, email, planExerciseId);
    const { rows } = await client.query<{ id: number }>(
      'SELECT id FROM workout_log WHERE plan_exercise_id = $1 AND date = $2',
      [planExerciseId, date],
    );
    const logId = rows.at(0)?.id;
    if (logId === undefined) throw new HttpError(404, 'Set not found');
    const { rowCount } = await client.query(
      'DELETE FROM workout_log_sets WHERE workout_log_id = $1 AND set_number = $2',
      [logId, setNumber],
    );
    if (!rowCount) throw new HttpError(404, 'Set not found');

    // Two steps: the unique (log, set_number) check runs row by row
    await client.query(
      `UPDATE workout_log_sets SET set_number = -set_number
       WHERE workout_log_id = $1 AND set_number > $2`,
      [logId, setNumber],
    );
    await client.query(
      `UPDATE workout_log_sets SET set_number = -set_number - 1
       WHERE workout_log_id = $1 AND set_number < 0`,
      [logId],
    );
    return { log: await loadOrPruneLog(client, logId) };
  });
};

export default workoutRoute({ PUT: putSet, DELETE: deleteSet });

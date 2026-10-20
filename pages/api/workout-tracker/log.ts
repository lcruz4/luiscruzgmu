import type { NextApiRequest } from 'next';
import { PASS_FAIL_WEEK } from '@/lib/workout/schedule';
import {
  bodyOf,
  dateField,
  HttpError,
  idField,
  nullableBooleanField,
  textField,
  workoutRoute,
} from '@/services/workoutApi';
import {
  getOwnedPlanExercise,
  loadOrPruneLog,
  withTransaction,
} from '@/services/workoutDb';
import type { LogResponse } from '@/types/workout';

// Body: { planExerciseId, date, passed, notes }. Replaces the exercise-level
// fields of that day's log, creating the log if needed.
const putLog = async (
  req: NextApiRequest,
  email: string,
): Promise<LogResponse> => {
  const body = bodyOf(req);
  const planExerciseId = idField(body.planExerciseId, 'planExerciseId');
  const date = dateField(body.date);
  const passed = nullableBooleanField(body.passed, 'passed');
  const notes = textField(body.notes, 'notes', 1000);

  return withTransaction(async (client) => {
    const { week } = await getOwnedPlanExercise(client, email, planExerciseId);
    if (passed !== null && week !== PASS_FAIL_WEEK) {
      throw new HttpError(400, `Pass/fail is only for Week ${PASS_FAIL_WEEK}`);
    }

    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO workout_log (plan_exercise_id, date, passed, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (plan_exercise_id, date)
       DO UPDATE SET passed = EXCLUDED.passed, notes = EXCLUDED.notes
       RETURNING id`,
      [planExerciseId, date, passed, notes],
    );
    return { log: await loadOrPruneLog(client, rows[0].id) };
  });
};

export default workoutRoute({ PUT: putLog });

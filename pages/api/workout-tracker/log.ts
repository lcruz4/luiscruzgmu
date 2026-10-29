import type { NextApiRequest } from 'next';
import {
  bodyOf,
  dateField,
  HttpError,
  idField,
  intField,
  nullableBooleanField,
  textField,
  workoutRoute,
} from '@/services/workoutApi';
import {
  assertOwnedPlanExercise,
  loadOrPruneLog,
  withTransaction,
} from '@/services/workoutDb';
import type { LogResponse } from '@/types/workout';

const MAX_SETS = 20;

const setsField = (value: unknown) => {
  if (!Array.isArray(value) || value.length > MAX_SETS) {
    throw new HttpError(400, `sets must be a list of up to ${MAX_SETS} sets`);
  }
  return value.map((set: unknown, index) => {
    if (
      typeof set !== 'object' ||
      set === null ||
      !('weight' in set && 'reps' in set && 'notes' in set)
    ) {
      throw new HttpError(
        400,
        `sets[${index}] must be { weight, reps, notes }`,
      );
    }
    return {
      weight: textField(set.weight, `sets[${index}].weight`, 50),
      reps: intField(set.reps, `sets[${index}].reps`, 0, 9999),
      notes: textField(set.notes, `sets[${index}].notes`, 1000),
    };
  });
};

// Body: { planExerciseId, date, passed, notes, sets: [{ weight, reps, notes }] }.
// Replaces that day's whole log for the exercise (sent on every save);
// set numbers follow the list order. Reps are seconds for timed exercises.
const putLog = async (
  req: NextApiRequest,
  email: string,
): Promise<LogResponse> => {
  const body = bodyOf(req);
  const planExerciseId = idField(body.planExerciseId, 'planExerciseId');
  const date = dateField(body.date);
  const passed = nullableBooleanField(body.passed, 'passed');
  const notes = textField(body.notes, 'notes', 1000);
  const sets = setsField(body.sets);

  return withTransaction(async (client) => {
    await assertOwnedPlanExercise(client, email, planExerciseId);

    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO workout_log (plan_exercise_id, date, passed, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (plan_exercise_id, date)
       DO UPDATE SET passed = EXCLUDED.passed, notes = EXCLUDED.notes
       RETURNING id`,
      [planExerciseId, date, passed, notes],
    );
    const logId = rows[0].id;
    await client.query(
      'DELETE FROM workout_log_sets WHERE workout_log_id = $1',
      [logId],
    );
    await client.query(
      `INSERT INTO workout_log_sets (workout_log_id, set_number, weight, reps, notes)
       SELECT $1, t.set_number, t.weight, t.reps, t.notes
       FROM unnest($2::text[], $3::int[], $4::text[])
         WITH ORDINALITY AS t(weight, reps, notes, set_number)`,
      [
        logId,
        sets.map((set) => set.weight),
        sets.map((set) => set.reps),
        sets.map((set) => set.notes),
      ],
    );
    return { log: await loadOrPruneLog(client, logId) };
  });
};

export default workoutRoute({ PUT: putLog });

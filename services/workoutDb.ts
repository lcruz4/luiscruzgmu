import { Pool, PoolClient } from 'pg';
import { HttpError } from './workoutApi';
import type { LogEntry, Plan } from '@/types/workout';

export const workoutPool = new Pool({
  connectionString: process.env.WORKOUT_DB_URL,
});

export const withTransaction = async <T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await workoutPool.connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const PLAN_ROW_SELECT = `
  SELECT pe.id, pe.week, pe.day, pe.position,
    pe.exercise_id AS "exerciseId", e.name, e.is_timed AS "isTimed",
    pe.sets, pe.reps, pe.weight, pe.notes
  FROM plan_exercises pe
  JOIN exercises e ON e.id = pe.exercise_id`;

// Sets of the workout_log aliased `wl`, as a LogSet[] column
export const SETS_JSON = `(
  SELECT coalesce(json_agg(json_build_object(
    'id', s.id, 'setNumber', s.set_number,
    'weight', s.weight, 'reps', s.reps, 'notes', s.notes
  ) ORDER BY s.set_number), '[]')
  FROM workout_log_sets s
  WHERE s.workout_log_id = wl.id
) AS sets`;

export const getActivePlan = async (email: string): Promise<Plan> => {
  const { rows } = await workoutPool.query<Plan>(
    'SELECT id, name FROM plans WHERE owner_email = $1 AND is_active',
    [email],
  );
  const plan = rows.at(0);
  if (!plan) throw new HttpError(404, 'No active plan');
  return plan;
};

// 404s for missing rows and rows of another owner alike
export const assertOwnedPlanExercise = async (
  client: PoolClient,
  email: string,
  planExerciseId: number,
) => {
  const { rowCount } = await client.query(
    `SELECT 1
     FROM plan_exercises pe
     JOIN plans p ON p.id = pe.plan_id
     WHERE pe.id = $1 AND p.owner_email = $2`,
    [planExerciseId, email],
  );
  if (!rowCount) throw new HttpError(404, 'Plan exercise not found');
};

// A log with no sets, note or pass/fail is deleted, so a stray entry that was
// undone doesn't count as a logged day for auto-next or history.
export const loadOrPruneLog = async (
  client: PoolClient,
  logId: number,
): Promise<LogEntry | null> => {
  await client.query(
    `DELETE FROM workout_log wl
     WHERE wl.id = $1 AND wl.passed IS NULL AND wl.notes IS NULL
       AND NOT EXISTS (SELECT 1 FROM workout_log_sets s WHERE s.workout_log_id = wl.id)`,
    [logId],
  );
  const { rows } = await client.query<LogEntry>(
    `SELECT wl.id, wl.passed, wl.notes, ${SETS_JSON}
     FROM workout_log wl
     WHERE wl.id = $1`,
    [logId],
  );
  return rows.at(0) ?? null;
};

import type { NextApiRequest } from 'next';
import {
  autoNext,
  DAYS_PER_WEEK,
  type LoggedDay,
  WEEKS,
} from '@/lib/workout/schedule';
import { dateField, intField, workoutRoute } from '@/services/workoutApi';
import {
  CREATED_AT_JSON,
  getActivePlan,
  PLAN_ROW_SELECT,
  SETS_JSON,
  workoutPool,
} from '@/services/workoutDb';
import type {
  DayLog,
  DayResponse,
  LastPerformance,
  PlanRow,
} from '@/types/workout';

// ?date=YYYY-MM-DD (the client's today, or a backfill date) [&week=&day=]
// Without week/day: auto-next (D17).
const getDay = async (
  req: NextApiRequest,
  email: string,
): Promise<DayResponse> => {
  const date = dateField(req.query.date);
  const plan = await getActivePlan(email);

  const { rows: lastDone } = await workoutPool.query<LoggedDay>(
    `SELECT pe.week, pe.day, max(wl.date)::text AS date
     FROM workout_log wl
     JOIN plan_exercises pe ON pe.id = wl.plan_exercise_id
     WHERE pe.plan_id = $1
     GROUP BY pe.week, pe.day
     ORDER BY max(wl.date) DESC, max(wl.created_at) DESC`,
    [plan.id],
  );

  const { week, day } =
    req.query.week === undefined && req.query.day === undefined
      ? autoNext(lastDone.at(0), date)
      : {
          week: intField(req.query.week, 'week', 1, WEEKS),
          day: intField(req.query.day, 'day', 1, DAYS_PER_WEEK),
        };

  const { rows: planRows } = await workoutPool.query<PlanRow>(
    `${PLAN_ROW_SELECT}
     WHERE pe.plan_id = $1 AND pe.week = $2 AND pe.day = $3
     ORDER BY pe.position`,
    [plan.id, week, day],
  );

  const [{ rows: logs }, { rows: lasts }] = await Promise.all([
    workoutPool.query<DayLog & { planExerciseId: number }>(
      `SELECT wl.id, wl.plan_exercise_id AS "planExerciseId", wl.passed, wl.notes,
         ${CREATED_AT_JSON}, ${SETS_JSON}
       FROM workout_log wl
       WHERE wl.plan_exercise_id = ANY($1) AND wl.date = $2`,
      [planRows.map((row) => row.id), date],
    ),
    // Last performance (D20): latest earlier log of the same exercise, any week/day
    workoutPool.query<LastPerformance & { exerciseId: number }>(
      `SELECT DISTINCT ON (pe.exercise_id)
         pe.exercise_id AS "exerciseId", wl.id, wl.date::text AS date,
         pe.week, pe.day, wl.passed, wl.notes, ${SETS_JSON}
       FROM workout_log wl
       JOIN plan_exercises pe ON pe.id = wl.plan_exercise_id
       JOIN plans p ON p.id = pe.plan_id
       WHERE p.owner_email = $1 AND pe.exercise_id = ANY($2) AND wl.date < $3
       ORDER BY pe.exercise_id, wl.date DESC, wl.created_at DESC`,
      [email, planRows.map((row) => row.exerciseId), date],
    ),
  ]);

  const logByRow = new Map(
    logs.map(({ planExerciseId, ...log }) => [planExerciseId, log]),
  );
  const lastByExercise = new Map(
    lasts.map(({ exerciseId, ...last }) => [exerciseId, last]),
  );

  return {
    plan,
    week,
    day,
    date,
    lastDone,
    exercises: planRows.map((row) => ({
      ...row,
      log: logByRow.get(row.id) ?? null,
      last: lastByExercise.get(row.exerciseId) ?? null,
    })),
  };
};

export default workoutRoute({ GET: getDay });

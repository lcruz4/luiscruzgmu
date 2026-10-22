import type { NextApiRequest } from 'next';
import type { PoolClient } from 'pg';
import {
  idsToSync,
  PLAN_FIELDS,
  type PlanField,
  type PlanRowKey,
} from '@/lib/workout/planSync';
import {
  bodyOf,
  HttpError,
  idField,
  intField,
  textField,
  workoutRoute,
} from '@/services/workoutApi';
import {
  getActivePlan,
  PLAN_ROW_SELECT,
  withTransaction,
  workoutPool,
} from '@/services/workoutDb';
import type { PlanResponse, PlanRow } from '@/types/workout';

const getPlanRows = async (
  db: PoolClient | typeof workoutPool,
  planId: number,
) => {
  const { rows } = await db.query<PlanRow>(
    `${PLAN_ROW_SELECT}
     WHERE pe.plan_id = $1
     ORDER BY pe.week, pe.day, pe.position`,
    [planId],
  );
  return rows;
};

const getPlan = async (
  _req: NextApiRequest,
  email: string,
): Promise<PlanResponse> => {
  const plan = await getActivePlan(email);
  return { plan, rows: await getPlanRows(workoutPool, plan.id) };
};

// Body: { id, sets, reps, weight, notes } for one row of the active plan.
// Each changed field is copied to the rows that share it (D13/D14).
const putPlan = async (
  req: NextApiRequest,
  email: string,
): Promise<PlanResponse> => {
  const body = bodyOf(req);
  const id = idField(body.id, 'id');
  const edit: Pick<PlanRow, PlanField> = {
    sets: intField(body.sets, 'sets', 1, 20),
    reps: intField(body.reps, 'reps', 1, 9999),
    weight: textField(body.weight, 'weight', 50),
    notes: textField(body.notes, 'notes', 1000),
  };
  const plan = await getActivePlan(email);

  return withTransaction(async (client) => {
    const { rows } = await client.query<PlanRowKey & Pick<PlanRow, PlanField>>(
      `SELECT id, plan_id AS "planId", week, exercise_id AS "exerciseId",
         sets, reps, weight, notes
       FROM plan_exercises
       WHERE plan_id = $1
       FOR UPDATE`,
      [plan.id],
    );
    const edited = rows.find((row) => row.id === id);
    if (!edited) throw new HttpError(404, 'Plan exercise not found');

    // Only changed fields sync, so a notes edit never overwrites other rows' weight
    for (const field of PLAN_FIELDS) {
      if (edit[field] === edited[field]) continue;
      await client.query(
        `UPDATE plan_exercises SET ${field} = $1 WHERE id = ANY($2)`,
        [edit[field], idsToSync(rows, edited, field)],
      );
    }
    return { plan, rows: await getPlanRows(client, plan.id) };
  });
};

export default workoutRoute({ GET: getPlan, PUT: putPlan });

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
  objectField,
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

// Body: { id, sets, reps, weight, notes, otherWeek? } for one row of the
// active plan. otherWeek: { id, sets, reps } of the same exercise's row in the
// other week. Each changed field is copied to the rows that share it (D13/D14).
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
  const other =
    body.otherWeek == null ? null : objectField(body.otherWeek, 'otherWeek');
  const otherEdit = other && {
    id: idField(other.id, 'otherWeek.id'),
    sets: intField(other.sets, 'otherWeek.sets', 1, 20),
    reps: intField(other.reps, 'otherWeek.reps', 1, 9999),
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

    const otherEdited =
      otherEdit && rows.find((row) => row.id === otherEdit.id);
    if (
      otherEdit &&
      (!otherEdited ||
        otherEdited.exerciseId !== edited.exerciseId ||
        otherEdited.week === edited.week)
    ) {
      throw new HttpError(
        400,
        'otherWeek must be the exercise in another week',
      );
    }

    // Only changed fields sync, so a notes edit never overwrites other rows' weight
    const sync = async (
      target: PlanRowKey & Pick<PlanRow, PlanField>,
      values: Partial<Pick<PlanRow, PlanField>>,
    ) => {
      for (const field of PLAN_FIELDS) {
        if (!(field in values) || values[field] === target[field]) continue;
        await client.query(
          `UPDATE plan_exercises SET ${field} = $1 WHERE id = ANY($2)`,
          [values[field], idsToSync(rows, target, field)],
        );
      }
    };
    await sync(edited, edit);
    if (otherEdited && otherEdit) {
      await sync(otherEdited, { sets: otherEdit.sets, reps: otherEdit.reps });
    }
    return { plan, rows: await getPlanRows(client, plan.id) };
  });
};

export default workoutRoute({ GET: getPlan, PUT: putPlan });

import type { NextApiRequest } from 'next';
import {
  bodyOf,
  HttpError,
  idField,
  textField,
  workoutAdminRoute,
} from '@/services/workoutApi';
import { deactivateOwnerPlans, getAdminPlan } from '@/services/workoutAdminDb';
import { withTransaction, workoutPool } from '@/services/workoutDb';
import type { AdminPlanResponse, AdminPlanSummary } from '@/types/workout';

const emailField = (value: unknown, name: string) => {
  const email = textField(value, name, 320)?.toLowerCase();
  if (!email?.includes('@')) {
    throw new HttpError(400, `${name} must be an email`);
  }
  return email;
};

const booleanField = (value: unknown, name: string) => {
  if (value === undefined) return false;
  if (typeof value !== 'boolean') {
    throw new HttpError(400, `${name} must be true or false`);
  }
  return value;
};

// Query: ownerEmail (optional) → that owner's plans, else every plan
const listPlans = async (
  req: NextApiRequest,
): Promise<{ plans: AdminPlanSummary[] }> => {
  const ownerEmail =
    req.query.ownerEmail === undefined
      ? null
      : emailField(req.query.ownerEmail, 'ownerEmail');
  const { rows } = await workoutPool.query<AdminPlanSummary>(
    `SELECT p.id, p.name, p.weeks, p.day_titles AS "dayTitles", p.owner_email AS "ownerEmail", p.is_active AS "isActive",
       (SELECT count(*)::int FROM plan_exercises pe WHERE pe.plan_id = p.id)
         AS "exerciseCount"
     FROM plans p
     WHERE $1::text IS NULL OR p.owner_email = $1
     ORDER BY p.owner_email, p.id`,
    [ownerEmail],
  );
  return { plans: rows };
};

// Body: { ownerEmail, name, sourcePlanId?, blank?, activate? }. Copies the
// source plan's weeks, day titles and exercises; blank resets sets/reps to 0 and clears weight/notes.
// activate deactivates the owner's current active plan.
const createPlan = async (req: NextApiRequest): Promise<AdminPlanResponse> => {
  const body = bodyOf(req);
  const ownerEmail = emailField(body.ownerEmail, 'ownerEmail');
  const name = textField(body.name, 'name', 100);
  if (!name) throw new HttpError(400, 'name is required');
  const sourcePlanId =
    body.sourcePlanId == null
      ? null
      : idField(body.sourcePlanId, 'sourcePlanId');
  const blank = booleanField(body.blank, 'blank');
  const activate = booleanField(body.activate, 'activate');

  return withTransaction(async (client) => {
    if (activate) await deactivateOwnerPlans(client, ownerEmail);
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO plans (owner_email, name, is_active, weeks, day_titles)
       VALUES ($1, $2, $3,
         coalesce((SELECT weeks FROM plans WHERE id = $4), 2),
         coalesce((SELECT day_titles FROM plans WHERE id = $4), '{"","","",""}'))
       RETURNING id`,
      [ownerEmail, name, activate, sourcePlanId],
    );
    const planId = rows[0].id;

    if (sourcePlanId) {
      const { rowCount } = await client.query(
        'SELECT 1 FROM plans WHERE id = $1',
        [sourcePlanId],
      );
      if (!rowCount) throw new HttpError(404, 'Source plan not found');
      await client.query(
        `INSERT INTO plan_exercises
           (plan_id, week, day, position, exercise_id, sets, reps, weight, notes)
         SELECT $1, week, day, position, exercise_id,
           CASE WHEN $3 THEN 0 ELSE sets END,
           CASE WHEN $3 THEN 0 ELSE reps END,
           CASE WHEN $3 THEN NULL ELSE weight END,
           CASE WHEN $3 THEN NULL ELSE notes END
         FROM plan_exercises
         WHERE plan_id = $2`,
        [planId, sourcePlanId, blank],
      );
    }
    return getAdminPlan(client, planId);
  });
};

export default workoutAdminRoute({ GET: listPlans, POST: createPlan });

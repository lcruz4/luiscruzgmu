import type { NextApiRequest } from 'next';
import {
  bodyOf,
  HttpError,
  idField,
  workoutAdminRoute,
} from '@/services/workoutApi';
import { withTransaction } from '@/services/workoutDb';
import type { AdminPlan } from '@/types/workout';

// Body: { active }. Activating deactivates the owner's current active plan.
const setActive = async (req: NextApiRequest): Promise<{ plan: AdminPlan }> => {
  const id = idField(req.query.id, 'id');
  const { active } = bodyOf(req);
  if (typeof active !== 'boolean') {
    throw new HttpError(400, 'active must be true or false');
  }

  return withTransaction(async (client) => {
    if (active) {
      await client.query(
        `UPDATE plans SET is_active = false
         WHERE is_active AND id <> $1
           AND owner_email = (SELECT owner_email FROM plans WHERE id = $1)`,
        [id],
      );
    }
    const { rows } = await client.query<AdminPlan>(
      `UPDATE plans SET is_active = $2 WHERE id = $1
       RETURNING id, name, owner_email AS "ownerEmail", is_active AS "isActive"`,
      [id, active],
    );
    const plan = rows.at(0);
    if (!plan) throw new HttpError(404, 'Plan not found');
    return { plan };
  });
};

export default workoutAdminRoute({ PUT: setActive });

import type { NextApiRequest } from 'next';
import {
  bodyOf,
  HttpError,
  idField,
  workoutAdminRoute,
} from '@/services/workoutApi';
import { deactivateOwnerPlans } from '@/services/workoutAdminDb';
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
    const { rows: owners } = await client.query<{ ownerEmail: string }>(
      'SELECT owner_email AS "ownerEmail" FROM plans WHERE id = $1 FOR UPDATE',
      [id],
    );
    const owner = owners.at(0);
    if (!owner) throw new HttpError(404, 'Plan not found');
    if (active) await deactivateOwnerPlans(client, owner.ownerEmail);

    const { rows } = await client.query<AdminPlan>(
      `UPDATE plans SET is_active = $2 WHERE id = $1
       RETURNING id, name, weeks, owner_email AS "ownerEmail", is_active AS "isActive"`,
      [id, active],
    );
    return { plan: rows[0] };
  });
};

export default workoutAdminRoute({ PUT: setActive });

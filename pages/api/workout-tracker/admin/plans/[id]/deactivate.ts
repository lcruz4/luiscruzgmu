import type { NextApiRequest } from 'next';
import { HttpError, idField, workoutAdminRoute } from '@/services/workoutApi';
import { workoutPool } from '@/services/workoutDb';
import type { AdminPlan } from '@/types/workout';

const deactivatePlan = async (
  req: NextApiRequest,
): Promise<{ plan: AdminPlan }> => {
  const { rows } = await workoutPool.query<AdminPlan>(
    `UPDATE plans SET is_active = false WHERE id = $1
     RETURNING id, name, owner_email AS "ownerEmail", is_active AS "isActive"`,
    [idField(req.query.id, 'id')],
  );
  const plan = rows.at(0);
  if (!plan) throw new HttpError(404, 'Plan not found');
  return { plan };
};

export default workoutAdminRoute({ POST: deactivatePlan });

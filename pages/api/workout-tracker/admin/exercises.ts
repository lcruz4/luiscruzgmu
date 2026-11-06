import { workoutAdminRoute } from '@/services/workoutApi';
import { workoutPool } from '@/services/workoutDb';
import type { AdminExercise } from '@/types/workout';

const listExercises = async (): Promise<{ exercises: AdminExercise[] }> => {
  const { rows } = await workoutPool.query<AdminExercise>(
    `SELECT id, name, is_timed AS "isTimed"
     FROM exercises
     ORDER BY name`,
  );
  return { exercises: rows };
};

export default workoutAdminRoute({ GET: listExercises });

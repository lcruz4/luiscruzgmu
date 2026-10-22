import type { NextApiRequest } from 'next';
import { idField, workoutRoute } from '@/services/workoutApi';
import { SETS_JSON, workoutPool } from '@/services/workoutDb';
import type { HistoryEntry, HistoryResponse } from '@/types/workout';

// Every log with its actual sets, newest first; ?exerciseId= narrows to one
// exercise. The client groups by date.
const getHistory = async (
  req: NextApiRequest,
  email: string,
): Promise<HistoryResponse> => {
  const exerciseId =
    req.query.exerciseId === undefined
      ? null
      : idField(req.query.exerciseId, 'exerciseId');

  const { rows: entries } = await workoutPool.query<HistoryEntry>(
    `SELECT wl.id, wl.date::text AS date, pe.week, pe.day, pe.position,
       pe.exercise_id AS "exerciseId", e.name, e.is_timed AS "isTimed",
       wl.passed, wl.notes, ${SETS_JSON}
     FROM workout_log wl
     JOIN plan_exercises pe ON pe.id = wl.plan_exercise_id
     JOIN plans p ON p.id = pe.plan_id
     JOIN exercises e ON e.id = pe.exercise_id
     WHERE p.owner_email = $1 AND ($2::int IS NULL OR pe.exercise_id = $2)
     ORDER BY wl.date DESC, pe.week, pe.day, pe.position`,
    [email, exerciseId],
  );
  return { entries };
};

export default workoutRoute({ GET: getHistory });

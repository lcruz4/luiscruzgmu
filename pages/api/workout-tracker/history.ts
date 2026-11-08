import type { NextApiRequest } from 'next';
import { idField, workoutRoute } from '@/services/workoutApi';
import { workoutPool } from '@/services/workoutDb';
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
       p.id AS "planId", p.name AS "planName", p.weeks AS "planWeeks", p.day_titles[pe.day] AS "dayTitle",
       pe.exercise_id AS "exerciseId", e.name, e.is_timed AS "isTimed",
       wl.passed, wl.notes, (
         SELECT coalesce(json_agg(json_build_object(
           'id', s.id, 'setNumber', s.set_number,
           'weight', s.weight, 'reps', s.reps, 'notes', s.notes
         ) ORDER BY s.set_number), '[]')
         FROM workout_log_sets s
         WHERE s.workout_log_id = wl.id
       ) AS sets
     FROM workout_log wl
     JOIN plan_exercises pe ON pe.id = wl.plan_exercise_id
     JOIN plans p ON p.id = pe.plan_id
     JOIN exercises e ON e.id = pe.exercise_id
     WHERE p.owner_email = $1 AND ($2::int IS NULL OR pe.exercise_id = $2)
     ORDER BY wl.date DESC, p.id, pe.week, pe.day, pe.position`,
    [email, exerciseId],
  );
  return { entries };
};

export default workoutRoute({ GET: getHistory });

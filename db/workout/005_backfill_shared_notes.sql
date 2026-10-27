-- Notes are now shared by every row of an exercise in a plan. Fill blank notes
-- from the exercise's other rows; exercises with conflicting notes are skipped.
WITH shared AS (
  SELECT plan_id, exercise_id, min(notes) AS notes
  FROM plan_exercises
  WHERE notes IS NOT NULL
  GROUP BY plan_id, exercise_id
  HAVING count(DISTINCT notes) = 1
)
UPDATE plan_exercises pe
SET notes = shared.notes
FROM shared
WHERE pe.plan_id = shared.plan_id
  AND pe.exercise_id = shared.exercise_id
  AND pe.notes IS NULL;

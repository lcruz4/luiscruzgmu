-- Run with: psql -v owner_email=<auth email> ...
-- Values from the 2 Week Workout sheet's Week 1 / Week 2 tabs as of 2026-10-17.
BEGIN;

WITH program AS (
  INSERT INTO programs (owner_email, name, is_active)
  VALUES (:'owner_email', '2 Week Workout', true)
  RETURNING id
)
INSERT INTO program_exercises (program_id, week, day, position, exercise_id, sets, reps, weight)
SELECT program.id, v.week, v.day, v.position, e.id, v.sets, v.reps, v.weight
FROM program
CROSS JOIN (VALUES
  (1, 1, 1, 'Incline dumbbell press', 3, '8', '50'),
  (1, 1, 2, 'Dumbbell bench press', 3, '8', '50'),
  (1, 1, 3, 'Cable cross-over (band, mid)', 3, '12', 'rb -1.5'),
  (1, 1, 4, 'Tricep dips', 3, '12', NULL),
  (1, 1, 5, 'DB overhead triceps extension', 3, '8', '25'),
  (1, 1, 6, 'Dumbbell lateral raise', 4, '12', '15'),
  (1, 1, 7, 'Weighted bench crunch', 3, '12', '25'),
  (1, 2, 1, 'Pull-up (bar)', 3, '5', NULL),
  (1, 2, 2, 'Prone dumbbell row', 3, '10', '30'),
  (1, 2, 3, 'Chin-up (bar)', 3, '6', NULL),
  (1, 2, 4, 'Dumbbell reverse flye', 3, '12', '15'),
  (1, 2, 5, 'Incline biceps curl', 3, '10', '30'),
  (1, 2, 6, 'Dumbbell hammer curl', 3, '12', '25'),
  (1, 2, 7, 'Dead hang', 2, '50s', NULL),
  (1, 3, 1, 'Front squat', 3, '6', '90'),
  (1, 3, 2, 'Romanian deadlift', 3, '6', '110'),
  (1, 3, 3, 'Bulgarian split squat', 3, '8', '35'),
  (1, 3, 4, 'Hamstring curl (band)', 3, '12', 'rb - 0.5'),
  (1, 3, 5, 'Single-leg calf raise (stair)', 3, '12', '35'),
  (1, 3, 6, 'Hanging leg raise (bar)', 3, '12', NULL),
  (1, 3, 7, 'Barbell roll-out', 3, '12', NULL),
  (1, 4, 1, 'Dumbbell overhead press', 3, '8', '40'),
  (1, 4, 2, 'Dumbbell flye', 3, '12', '40'),
  (1, 4, 3, 'Single-arm dumbbell row', 3, '10', '40'),
  (1, 4, 4, 'Band lateral raise (low anchor)', 4, '12', 'y -1'),
  (1, 4, 5, 'Band face pull', 3, '15', 'rb -1'),
  (1, 4, 6, 'Dumbbell skull crusher', 3, '10', '20'),
  (1, 4, 7, 'Incline biceps curl', 3, '10', '30'),
  (2, 1, 1, 'Incline dumbbell press', 3, '10', '50'),
  (2, 1, 2, 'Dumbbell bench press', 3, '10', '50'),
  (2, 1, 3, 'Cable cross-over (band, mid)', 3, '15', 'rb -1.5'),
  (2, 1, 4, 'Tricep dips', 3, '15', NULL),
  (2, 1, 5, 'DB overhead triceps extension', 3, '10', '25'),
  (2, 1, 6, 'Dumbbell lateral raise', 4, '15', '15'),
  (2, 1, 7, 'Weighted bench crunch', 3, '15', '25'),
  (2, 2, 1, 'Pull-up (bar)', 3, '6', NULL),
  (2, 2, 2, 'Prone dumbbell row', 3, '12', '30'),
  (2, 2, 3, 'Chin-up (bar)', 3, '7', NULL),
  (2, 2, 4, 'Dumbbell reverse flye', 3, '15', '15'),
  (2, 2, 5, 'Incline biceps curl', 3, '12', '30'),
  (2, 2, 6, 'Dumbbell hammer curl', 3, '15', '25'),
  (2, 2, 7, 'Dead hang', 2, '60s', NULL),
  (2, 3, 1, 'Front squat', 3, '8', '90'),
  (2, 3, 2, 'Romanian deadlift', 3, '8', '110'),
  (2, 3, 3, 'Bulgarian split squat', 3, '10', '35'),
  (2, 3, 4, 'Hamstring curl (band)', 3, '15', 'rb - 0.5'),
  (2, 3, 5, 'Single-leg calf raise (stair)', 3, '15', '35'),
  (2, 3, 6, 'Hanging leg raise (bar)', 3, '15', NULL),
  (2, 3, 7, 'Barbell roll-out', 3, '15', NULL),
  (2, 4, 1, 'Dumbbell overhead press', 3, '10', '40'),
  (2, 4, 2, 'Dumbbell flye', 3, '15', '40'),
  (2, 4, 3, 'Single-arm dumbbell row', 3, '12', '40'),
  (2, 4, 4, 'Band lateral raise (low anchor)', 4, '15', 'y -1'),
  (2, 4, 5, 'Band face pull', 3, '18', 'rb -1'),
  (2, 4, 6, 'Dumbbell skull crusher', 3, '12', '20'),
  (2, 4, 7, 'Incline biceps curl', 3, '12', '30')
) AS v (week, day, position, exercise, sets, reps, weight)
JOIN exercises e ON e.name = v.exercise;

COMMIT;

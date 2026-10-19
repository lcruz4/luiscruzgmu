BEGIN;

CREATE TABLE muscles (
  slug text PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE exercises (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  aliases text[] NOT NULL DEFAULT '{}'
);

-- factor = how much one set counts toward the muscle (1.0 / 0.5 / 0.25), not load
CREATE TABLE exercise_muscles (
  exercise_id int NOT NULL REFERENCES exercises (id),
  muscle_slug text NOT NULL REFERENCES muscles (slug),
  factor numeric(3, 2) NOT NULL,
  PRIMARY KEY (exercise_id, muscle_slug)
);

CREATE TABLE programs (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_email text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX programs_one_active_per_owner
  ON programs (owner_email)
  WHERE is_active;

CREATE TABLE program_exercises (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  program_id int NOT NULL REFERENCES programs (id),
  week int NOT NULL,
  day int NOT NULL,
  position int NOT NULL,
  exercise_id int NOT NULL REFERENCES exercises (id),
  sets int NOT NULL,
  reps text,
  weight text,
  notes text,
  UNIQUE (program_id, week, day, position)
);

CREATE TABLE workout_log (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  program_exercise_id int NOT NULL REFERENCES program_exercises (id),
  date date NOT NULL,
  passed boolean,
  notes text,
  UNIQUE (program_exercise_id, date)
);

CREATE TABLE workout_sets (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workout_log_id int NOT NULL REFERENCES workout_log (id) ON DELETE CASCADE,
  set_number int NOT NULL,
  weight text,
  reps text,
  note text,
  UNIQUE (workout_log_id, set_number)
);

COMMIT;

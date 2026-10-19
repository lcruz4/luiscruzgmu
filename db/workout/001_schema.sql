CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE muscles (
  slug text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE exercises (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  aliases text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- factor = how much one set counts toward the muscle (1.0 / 0.5 / 0.25), not load
CREATE TABLE exercise_muscles (
  exercise_id int NOT NULL REFERENCES exercises (id),
  muscle_slug text NOT NULL REFERENCES muscles (slug),
  factor numeric(3, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (exercise_id, muscle_slug)
);

CREATE TABLE programs (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_email text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
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
  reps int NOT NULL,
  weight text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, week, day, position)
);

CREATE TABLE workout_log (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  program_exercise_id int NOT NULL REFERENCES program_exercises (id),
  date date NOT NULL,
  passed boolean,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_exercise_id, date)
);

CREATE TABLE workout_log_sets (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workout_log_id int NOT NULL REFERENCES workout_log (id) ON DELETE CASCADE,
  set_number int NOT NULL,
  weight text,
  reps int,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workout_log_id, set_number)
);

CREATE TRIGGER muscles_set_updated_at BEFORE UPDATE ON muscles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER exercises_set_updated_at BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER exercise_muscles_set_updated_at BEFORE UPDATE ON exercise_muscles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER programs_set_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER program_exercises_set_updated_at BEFORE UPDATE ON program_exercises
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER workout_log_set_updated_at BEFORE UPDATE ON workout_log
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER workout_log_sets_set_updated_at BEFORE UPDATE ON workout_log_sets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

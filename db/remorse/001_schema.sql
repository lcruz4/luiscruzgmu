CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- local = one player on one device plays both sides (white_email = black_email)
-- state = the board after the last step; version bumps on every step and undo
CREATE TABLE games (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mode text NOT NULL CHECK (mode IN ('online', 'local')),
  created_by text NOT NULL,
  white_email text,
  black_email text,
  initial_state jsonb NOT NULL,
  state jsonb NOT NULL,
  version int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX games_white_email ON games (white_email);
CREATE INDEX games_black_email ON games (black_email);

CREATE TRIGGER games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- One player action (a move or a bishop's self-heal) and everything it set off.
-- rolls = the dice the server rolled for it; undo deletes the last step.
CREATE TABLE game_steps (
  game_id int NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  step int NOT NULL,
  color text NOT NULL CHECK (color IN ('w', 'b')),
  email text NOT NULL,
  action jsonb NOT NULL,
  rolls int[] NOT NULL DEFAULT '{}',
  events jsonb NOT NULL,
  state_after jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, step)
);

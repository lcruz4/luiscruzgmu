-- A player's chosen display name. Without one, the name is the part of their
-- email before the @. A row with a null username: they were asked to pick a
-- name and kept the default.
CREATE TABLE players (
  email text PRIMARY KEY,
  username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX players_username ON players (lower(username));

CREATE TRIGGER players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

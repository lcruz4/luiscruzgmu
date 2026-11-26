-- One Glicko-1 rating per time control category (lib/remorse/timeControls.ts).
-- Every game before time controls was untimed, so those ratings become daily.
CREATE TABLE player_ratings (
  email text NOT NULL REFERENCES players (email) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('bullet', 'blitz', 'rapid', 'daily')),
  rating double precision NOT NULL DEFAULT 1200,
  rating_rd double precision NOT NULL DEFAULT 350,
  rated_at timestamptz,
  PRIMARY KEY (email, category)
);

INSERT INTO player_ratings (email, category, rating, rating_rd, rated_at)
SELECT email, 'daily', rating, rating_rd, rated_at
FROM players;

INSERT INTO player_ratings (email, category)
SELECT p.email, c.category
FROM players p
CROSS JOIN unnest(ARRAY['bullet', 'blitz', 'rapid']) AS c (category);

-- Every player starts with all four, however their row was made
CREATE FUNCTION add_player_ratings() RETURNS trigger AS $$
BEGIN
  INSERT INTO player_ratings (email, category)
  SELECT NEW.email, c.category
  FROM unnest(ARRAY['bullet', 'blitz', 'rapid', 'daily']) AS c (category)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_add_ratings AFTER INSERT ON players
  FOR EACH ROW EXECUTE FUNCTION add_player_ratings();

ALTER TABLE players
  DROP COLUMN rating,
  DROP COLUMN rating_rd,
  DROP COLUMN rated_at;

-- time_control: an id from TIME_CONTROLS; null for the untimed games from before
-- category: the rating it counts toward
-- white_ms / black_ms: a live game's time left for each side, as of its last turn
-- turn_started_at: when the side to move's clock started
-- deadline: when the side to move runs out of time; null while no clock runs
ALTER TABLE games
  ADD COLUMN time_control text,
  ADD COLUMN category text NOT NULL DEFAULT 'daily'
    CHECK (category IN ('bullet', 'blitz', 'rapid', 'daily')),
  ADD COLUMN white_ms int,
  ADD COLUMN black_ms int,
  ADD COLUMN turn_started_at timestamptz,
  ADD COLUMN deadline timestamptz;

ALTER TABLE games ALTER COLUMN category DROP DEFAULT;

CREATE INDEX games_deadline ON games (deadline) WHERE deadline IS NOT NULL;

CREATE INDEX games_matchmaking_control ON games (time_control, created_at)
  WHERE matchmaking AND (white_email IS NULL OR black_email IS NULL);

DROP INDEX games_matchmaking_open;

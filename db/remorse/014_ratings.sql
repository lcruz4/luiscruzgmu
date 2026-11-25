-- Glicko-1 ratings (lib/remorse/glicko.ts) for online games against someone
-- else. rating_rd: the rating's uncertainty as of rated_at, the player's last
-- rated game; it grows with time off before the next one is rated.
ALTER TABLE players
  ADD COLUMN rating double precision NOT NULL DEFAULT 1200,
  ADD COLUMN rating_rd double precision NOT NULL DEFAULT 350,
  ADD COLUMN rated_at timestamptz;

-- Each player's rating before and after a rated game, for the game's page
CREATE TABLE rating_changes (
  game_id int NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  email text NOT NULL,
  rating_before double precision NOT NULL,
  rating_after double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, email)
);

-- Backfill: replay every finished rated game in the order it ended
CREATE FUNCTION pg_temp.inflated_rd(rd double precision, rated_at timestamptz, at timestamptz)
RETURNS double precision AS $$
  SELECT CASE
    WHEN rated_at IS NULL THEN rd
    ELSE least(350, sqrt(rd ^ 2 + (350 ^ 2 - 50 ^ 2) / 365
      * greatest(0, extract(epoch FROM at - rated_at) / 86400)))
  END
$$ LANGUAGE sql IMMUTABLE;

CREATE FUNCTION pg_temp.glicko(
  r double precision, rd double precision,
  rj double precision, rdj double precision,
  score double precision,
  OUT rating double precision, OUT new_rd double precision
) AS $$
DECLARE
  q CONSTANT double precision := ln(10) / 400;
  gj double precision := 1 / sqrt(1 + 3 * q ^ 2 * rdj ^ 2 / pi() ^ 2);
  expected double precision := 1 / (1 + 10 ^ (-gj * (r - rj) / 400));
  d_squared double precision := 1 / (q ^ 2 * gj ^ 2 * expected * (1 - expected));
  total_precision double precision := 1 / rd ^ 2 + 1 / d_squared;
BEGIN
  rating := r + q / total_precision * gj * (score - expected);
  new_rd := greatest(45, sqrt(1 / total_precision));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

INSERT INTO players (email)
SELECT white_email FROM games WHERE white_email IS NOT NULL
UNION
SELECT black_email FROM games WHERE black_email IS NOT NULL
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  game record;
  w players%ROWTYPE;
  b players%ROWTYPE;
  w_rd double precision;
  b_rd double precision;
  w_score double precision;
  w_new record;
  b_new record;
BEGIN
  FOR game IN
    SELECT g.id, g.white_email, g.black_email, g.state->>'winner' AS winner,
           max(s.created_at) AS finished_at
    FROM games g
    JOIN game_steps s ON s.game_id = g.id
    WHERE g.mode = 'online'
      AND g.state->>'winner' IS NOT NULL
      AND g.white_email <> g.black_email
    GROUP BY g.id
    ORDER BY finished_at, g.id
  LOOP
    SELECT * INTO w FROM players WHERE email = game.white_email;
    SELECT * INTO b FROM players WHERE email = game.black_email;
    w_rd := pg_temp.inflated_rd(w.rating_rd, w.rated_at, game.finished_at);
    b_rd := pg_temp.inflated_rd(b.rating_rd, b.rated_at, game.finished_at);
    w_score := CASE game.winner WHEN 'w' THEN 1 WHEN 'b' THEN 0 ELSE 0.5 END;
    w_new := pg_temp.glicko(w.rating, w_rd, b.rating, b_rd, w_score);
    b_new := pg_temp.glicko(b.rating, b_rd, w.rating, w_rd, 1 - w_score);

    INSERT INTO rating_changes
      (game_id, email, rating_before, rating_after, created_at)
    VALUES
      (game.id, w.email, w.rating, w_new.rating, game.finished_at),
      (game.id, b.email, b.rating, b_new.rating, game.finished_at);
    UPDATE players
    SET rating = w_new.rating, rating_rd = w_new.new_rd, rated_at = game.finished_at
    WHERE email = w.email;
    UPDATE players
    SET rating = b_new.rating, rating_rd = b_new.new_rd, rated_at = game.finished_at
    WHERE email = b.email;
  END LOOP;
END;
$$;

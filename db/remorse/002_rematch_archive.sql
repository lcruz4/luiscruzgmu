-- The finished game this one is a rematch of; unique so both players asking
-- for a rematch land in the same new game
ALTER TABLE games ADD COLUMN rematch_of int UNIQUE REFERENCES games (id) ON DELETE SET NULL;

-- Games a player has hidden from their lobby
CREATE TABLE game_archives (
  game_id int NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, email)
);

-- Whether the player has answered the name prompt (picked a name or kept the
-- default). A row alone no longer means that: saving board colors or a piece
-- set creates one too. Existing rows count as answered unless all they hold is
-- board settings.
ALTER TABLE players ADD COLUMN name_chosen boolean NOT NULL DEFAULT false;

UPDATE players
SET name_chosen = username IS NOT NULL
  OR icon IS NOT NULL
  OR (piece_set IS NULL AND board_theme IS NULL);

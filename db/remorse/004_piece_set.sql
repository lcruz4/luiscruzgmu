-- The player's piece set: one of PIECE_SETS (lib/remorse/pieceSets.ts), null
-- for the default.
ALTER TABLE players ADD COLUMN piece_set text;

-- The player's board colors: one of BOARD_THEMES (lib/remorse/boardThemes.ts),
-- null for the default.
ALTER TABLE players ADD COLUMN board_theme text;

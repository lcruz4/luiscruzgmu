-- Tutorial pieces the player has seen: 'intro' (the rules dialog on their
-- first game) and one key per rule callout (lib/remorse/tutorial.ts).
-- Anyone who already played skips the intro but still gets the callouts.
ALTER TABLE players ADD COLUMN tutorial_seen text[] NOT NULL DEFAULT '{}';

INSERT INTO players (email)
SELECT white_email FROM games WHERE white_email IS NOT NULL
UNION
SELECT black_email FROM games WHERE black_email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

UPDATE players
SET tutorial_seen = '{intro}'
WHERE email IN (
  SELECT white_email FROM games
  UNION
  SELECT black_email FROM games
);

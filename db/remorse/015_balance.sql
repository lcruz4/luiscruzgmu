-- balanced: the die leans toward the lower-rated player
-- (lib/remorse/balance.ts); never rated.
-- balance: the odds it rolls with, fixed at its first roll:
-- {"version": n, "w": {"rating": r, "odds": [6 chances]}, "b": {...}}
ALTER TABLE games
  ADD COLUMN balanced boolean NOT NULL DEFAULT false,
  ADD COLUMN balance jsonb;

-- A player's answer to the suggestion to play an opponent balanced; each
-- player is asked once per opponent
CREATE TABLE balance_suggestions (
  email text NOT NULL,
  opponent_email text NOT NULL,
  accepted boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (email, opponent_email)
);

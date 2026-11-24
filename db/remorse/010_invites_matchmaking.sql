-- invite_token: the secret in a friend game's invite link; only someone with
-- it can take the open seat. Cleared once both seats are taken.
-- matchmaking: created by "Play someone random"; its open seat is filled by
-- the next player who asks for a random game, never by a link.
ALTER TABLE games
  ADD COLUMN invite_token uuid,
  ADD COLUMN matchmaking boolean NOT NULL DEFAULT false;

UPDATE games
SET invite_token = gen_random_uuid()
WHERE mode = 'online' AND (white_email IS NULL OR black_email IS NULL);

CREATE INDEX games_matchmaking_open ON games (created_at)
  WHERE matchmaking AND (white_email IS NULL OR black_email IS NULL);

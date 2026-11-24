-- id: a player's public handle for their page's URL. Every seated player gets
-- a row so they have one.
ALTER TABLE players ADD COLUMN id int GENERATED ALWAYS AS IDENTITY UNIQUE;

INSERT INTO players (email)
SELECT white_email FROM games WHERE white_email IS NOT NULL
UNION
SELECT black_email FROM games WHERE black_email IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE TABLE follows (
  follower_email text NOT NULL,
  followee_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_email, followee_email),
  CHECK (follower_email <> followee_email)
);

CREATE INDEX follows_followee ON follows (followee_email);

-- The player a challenge waits on; only they can take the open seat.
-- Cleared once they accept.
ALTER TABLE games ADD COLUMN challenged_email text;

CREATE INDEX games_challenged_email ON games (challenged_email)
  WHERE challenged_email IS NOT NULL;

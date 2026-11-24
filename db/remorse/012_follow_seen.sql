-- seen_at: when the followed player saw or answered the follow in their
-- lobby; null shows it there as new. Follows from before this count as seen.
ALTER TABLE follows ADD COLUMN seen_at timestamptz;

UPDATE follows SET seen_at = now();

CREATE INDEX follows_unseen ON follows (followee_email)
  WHERE seen_at IS NULL;

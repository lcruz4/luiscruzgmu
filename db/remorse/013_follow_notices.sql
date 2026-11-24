-- Each follower → followee pair is announced (push and lobby row) once, so
-- unfollowing and following again doesn't notify again
CREATE TABLE follow_notices (
  follower_email text NOT NULL,
  followee_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_email, followee_email)
);

INSERT INTO follow_notices (follower_email, followee_email)
SELECT follower_email, followee_email FROM follows;

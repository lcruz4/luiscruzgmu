-- Players who asked to hear when the deploy blocking live games is done
CREATE TABLE deploy_waiters (
  email text PRIMARY KEY REFERENCES players (email) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Weeks in the plan's rotation; auto-next wraps after the last one
ALTER TABLE plans
  ADD COLUMN weeks int NOT NULL DEFAULT 2 CHECK (weeks BETWEEN 1 AND 4);

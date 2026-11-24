-- Players who said they'd download a native App Store version. One row per
-- account, so the player count can't be inflated; clicks counts every tap.
CREATE TABLE app_store_pledges (
  email text PRIMARY KEY,
  clicks integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_clicked_at timestamptz NOT NULL DEFAULT now()
);

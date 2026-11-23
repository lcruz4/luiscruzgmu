-- Players who said they'd download a native App Store version. One row per
-- account, so the count on the get-the-app page can't be inflated.
CREATE TABLE app_store_pledges (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

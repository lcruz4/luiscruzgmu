-- Web Push subscriptions, one per browser or installed app. endpoint is the
-- push service URL the browser handed out; p256dh and auth encrypt payloads.
CREATE TABLE push_subscriptions (
  endpoint text PRIMARY KEY,
  email text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX push_subscriptions_email ON push_subscriptions (email);

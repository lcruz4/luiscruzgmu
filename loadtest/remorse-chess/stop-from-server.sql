-- Kill switch, run against the lcruz_auth DB: revokes the load-test sessions.
-- Every request then gets a 401 and k6 aborts the run within a few seconds.
-- Run accounts.mjs and the new auth-seed.sql to test again.
DELETE FROM user_sessions WHERE email LIKE 'loadtest-%@loadtest.invalid';

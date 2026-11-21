-- Removes the load-test accounts from the lcruz_auth DB (roles go with the users)
BEGIN;
DELETE FROM user_sessions WHERE email LIKE 'loadtest-%@loadtest.invalid';
DELETE FROM users WHERE email LIKE 'loadtest-%@loadtest.invalid';
COMMIT;

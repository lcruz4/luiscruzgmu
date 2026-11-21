-- Removes the load test's games from the remorse_chess DB (steps cascade)
DELETE FROM games WHERE created_by LIKE 'loadtest-%@loadtest.invalid';
VACUUM ANALYZE games;
VACUUM ANALYZE game_steps;

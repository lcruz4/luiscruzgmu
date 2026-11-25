-- How balanced balance mode games come out, per BALANCE_VERSION
-- (lib/remorse/balance.ts). Read-only. Run against the remorse prod DB:
--   psql "<remorse prod url>" -f scripts/remorse-balance-report.sql
-- and paste the output back. The favorite is the higher-rated side when the
-- game's odds were fixed (its first roll); a game with no capture has no
-- odds and is left out.

\echo '== Results: the favorite should score near 0.5 in balanced games =='
WITH finished AS (
  SELECT g.id,
         (g.balance->>'version')::int AS version,
         (g.balance->'w'->>'rating')::float AS white_rating,
         (g.balance->'b'->>'rating')::float AS black_rating,
         g.state->>'winner' AS winner
  FROM games g
  WHERE g.balanced
    AND g.balance IS NOT NULL
    AND g.state->>'winner' IS NOT NULL
),
sided AS (
  SELECT version,
         abs(white_rating - black_rating) AS gap,
         CASE
           WHEN winner = 'draw' THEN 0.5
           WHEN (winner = 'w') = (white_rating >= black_rating) THEN 1
           ELSE 0
         END AS favorite_score
  FROM finished
)
SELECT version,
       CASE
         WHEN gap < 100 THEN '0-99'
         WHEN gap < 200 THEN '100-199'
         WHEN gap < 400 THEN '200-399'
         ELSE '400+'
       END AS rating_gap,
       count(*) AS games,
       round(avg(1 / (1 + 10 ^ (-gap / 400)))::numeric, 2) AS unbalanced_expected,
       round(avg(favorite_score)::numeric, 2) AS favorite_score
FROM sided
GROUP BY 1, 2
ORDER BY 1, 2;

\echo '== Baseline: the favorite in standard rated games =='
WITH pairs AS (
  SELECT g.id,
         g.state->>'winner' AS winner,
         rw.rating_before AS white_rating,
         rb.rating_before AS black_rating
  FROM games g
  JOIN rating_changes rw ON rw.game_id = g.id AND rw.email = g.white_email
  JOIN rating_changes rb ON rb.game_id = g.id AND rb.email = g.black_email
),
sided AS (
  SELECT abs(white_rating - black_rating) AS gap,
         CASE
           WHEN winner = 'draw' THEN 0.5
           WHEN (winner = 'w') = (white_rating >= black_rating) THEN 1
           ELSE 0
         END AS favorite_score
  FROM pairs
)
SELECT CASE
         WHEN gap < 100 THEN '0-99'
         WHEN gap < 200 THEN '100-199'
         WHEN gap < 400 THEN '200-399'
         ELSE '400+'
       END AS rating_gap,
       count(*) AS games,
       round(avg(1 / (1 + 10 ^ (-gap / 400)))::numeric, 2) AS expected,
       round(avg(favorite_score)::numeric, 2) AS favorite_score
FROM sided
GROUP BY 1
ORDER BY 1;

\echo '== Rolls: what each side was meant to roll vs what it rolled =='
WITH rolled AS (
  SELECT (g.balance->>'version')::int AS version,
         CASE
           WHEN ((g.balance->'w'->>'rating')::float >= (g.balance->'b'->>'rating')::float) = (s.color = 'w')
             THEN 'favorite'
           ELSE 'underdog'
         END AS side,
         g.balance->s.color->'odds' AS odds,
         roll
  FROM games g
  JOIN game_steps s ON s.game_id = g.id
  CROSS JOIN LATERAL unnest(s.rolls) roll
  WHERE g.balanced AND g.balance IS NOT NULL
)
SELECT version,
       side,
       count(*) AS rolls,
       round(avg((odds->>0)::float)::numeric * 100) || '% / ' ||
         round(avg((roll = 1)::int)::numeric * 100) || '%' AS devastated_meant_got,
       round(avg((odds->>1)::float + (odds->>2)::float)::numeric * 100) || '% / ' ||
         round(avg((roll IN (2, 3))::int)::numeric * 100) || '%' AS guilt_meant_got,
       round(avg((odds->>3)::float + (odds->>4)::float)::numeric * 100) || '% / ' ||
         round(avg((roll IN (4, 5))::int)::numeric * 100) || '%' AS unaffected_meant_got,
       round(avg((odds->>5)::float)::numeric * 100) || '% / ' ||
         round(avg((roll = 6)::int)::numeric * 100) || '%' AS psychopath_meant_got
FROM rolled
GROUP BY 1, 2
ORDER BY 1, 2;

\echo '== Each balanced game =='
SELECT g.id,
       (g.balance->>'version')::int AS version,
       round((g.balance->'w'->>'rating')::numeric) AS white_rating,
       round((g.balance->'b'->>'rating')::numeric) AS black_rating,
       COALESCE(g.state->>'winner', 'in progress') AS winner,
       (SELECT count(*) FROM game_steps s WHERE s.game_id = g.id) AS steps,
       g.updated_at::date AS updated
FROM games g
WHERE g.balanced
ORDER BY g.id DESC
LIMIT 50;

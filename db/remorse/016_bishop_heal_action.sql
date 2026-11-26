-- The bishop's heal now also mends hurt pieces next to it, so its action is
-- renamed from selfHeal to bishopHeal
UPDATE game_steps
SET action = jsonb_set(action, '{type}', '"bishopHeal"')
WHERE action ->> 'type' = 'selfHeal';

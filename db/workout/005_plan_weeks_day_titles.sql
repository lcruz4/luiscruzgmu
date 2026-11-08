-- weeks: weeks in the plan's rotation; auto-next wraps after the last one.
-- day_titles: one per day of the week, '' = untitled.
ALTER TABLE plans
  ADD COLUMN weeks int NOT NULL DEFAULT 2 CHECK (weeks BETWEEN 1 AND 52),
  ADD COLUMN day_titles text[] NOT NULL DEFAULT '{"","","",""}'
    CHECK (cardinality(day_titles) = 4);

-- The titles the app hard-coded until now
UPDATE plans
SET day_titles = ARRAY[
  'Chest · Triceps · Abs',
  'Back · Biceps',
  'Legs · Abs',
  'Shoulders · Arms'
];

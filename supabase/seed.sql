-- =============================================================================
-- Hypertrophy Tracker — Seed Data
-- =============================================================================
-- ~30 common exercises across 7 muscle groups for the default exercise library.
-- These are global (is_custom = false, user_id = NULL).
-- =============================================================================

INSERT INTO public.exercises (name, muscle_group, is_custom, user_id) VALUES
  -- Chest (5)
  ('Barbell Bench Press',        'Chest',      false, NULL),
  ('Incline Dumbbell Press',     'Chest',      false, NULL),
  ('Cable Fly',                  'Chest',      false, NULL),
  ('Dumbbell Fly',               'Chest',      false, NULL),
  ('Push-Up',                    'Chest',      false, NULL),

  -- Back (5)
  ('Barbell Row',                'Back',       false, NULL),
  ('Pull-Up',                    'Back',       false, NULL),
  ('Lat Pulldown',               'Back',       false, NULL),
  ('Seated Cable Row',           'Back',       false, NULL),
  ('Dumbbell Row',               'Back',       false, NULL),

  -- Shoulders (4)
  ('Overhead Press',             'Shoulders',  false, NULL),
  ('Lateral Raise',              'Shoulders',  false, NULL),
  ('Face Pull',                  'Shoulders',  false, NULL),
  ('Rear Delt Fly',              'Shoulders',  false, NULL),

  -- Quads (4)
  ('Barbell Squat',              'Quads',      false, NULL),
  ('Leg Press',                  'Quads',      false, NULL),
  ('Leg Extension',              'Quads',      false, NULL),
  ('Bulgarian Split Squat',      'Quads',      false, NULL),

  -- Hamstrings (4)
  ('Romanian Deadlift',          'Hamstrings', false, NULL),
  ('Lying Leg Curl',             'Hamstrings', false, NULL),
  ('Seated Leg Curl',            'Hamstrings', false, NULL),
  ('Stiff-Leg Deadlift',        'Hamstrings', false, NULL),

  -- Arms (5)
  ('Barbell Curl',               'Arms',       false, NULL),
  ('Hammer Curl',                'Arms',       false, NULL),
  ('Tricep Pushdown',            'Arms',       false, NULL),
  ('Overhead Tricep Extension',  'Arms',       false, NULL),
  ('Incline Dumbbell Curl',      'Arms',       false, NULL),

  -- Core (3)
  ('Cable Crunch',               'Core',       false, NULL),
  ('Hanging Leg Raise',          'Core',       false, NULL),
  ('Ab Wheel Rollout',           'Core',       false, NULL)
ON CONFLICT DO NOTHING;

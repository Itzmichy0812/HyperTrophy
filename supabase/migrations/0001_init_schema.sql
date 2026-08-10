-- =============================================================================
-- Hypertrophy Tracker — Canonical Schema Migration
-- =============================================================================
-- Source of truth for the database. All column/table changes start here.
-- Run with: supabase migration up  (or supabase db reset during local dev)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES — extends auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  unit_pref     TEXT NOT NULL DEFAULT 'kg' CHECK (unit_pref IN ('kg', 'lbs')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. EXERCISES — global library + user custom exercises
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercises (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  muscle_group  TEXT NOT NULL CHECK (muscle_group IN (
    'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Arms', 'Core'
  )),
  is_custom     BOOLEAN NOT NULL DEFAULT false,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_muscle_group ON public.exercises(muscle_group);
CREATE INDEX idx_exercises_user_id ON public.exercises(user_id);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Everyone can read global exercises; users can also read their own custom ones
CREATE POLICY "Users can view exercises"
  ON public.exercises FOR SELECT
  USING (is_custom = false OR auth.uid() = user_id);

CREATE POLICY "Users can insert custom exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_custom = true);

CREATE POLICY "Users can update own custom exercises"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = user_id AND is_custom = true);

CREATE POLICY "Users can delete own custom exercises"
  ON public.exercises FOR DELETE
  USING (auth.uid() = user_id AND is_custom = true);

-- ---------------------------------------------------------------------------
-- 3. TRAINING PLANS — named templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.training_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_plans_user_id ON public.training_plans(user_id);

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans"
  ON public.training_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON public.training_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON public.training_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON public.training_plans FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. PLAN EXERCISES — exercises within a plan
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plan_exercises (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  exercise_id   UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  target_sets   INTEGER NOT NULL DEFAULT 3,
  target_reps   INTEGER NOT NULL DEFAULT 10,
  target_rir    INTEGER NOT NULL DEFAULT 2,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_exercises_plan_id ON public.plan_exercises(plan_id);

ALTER TABLE public.plan_exercises ENABLE ROW LEVEL SECURITY;

-- RLS via join to training_plans.user_id
CREATE POLICY "Users can view own plan exercises"
  ON public.plan_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.training_plans
      WHERE training_plans.id = plan_exercises.plan_id
        AND training_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan exercises"
  ON public.plan_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_plans
      WHERE training_plans.id = plan_exercises.plan_id
        AND training_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan exercises"
  ON public.plan_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.training_plans
      WHERE training_plans.id = plan_exercises.plan_id
        AND training_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan exercises"
  ON public.plan_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.training_plans
      WHERE training_plans.id = plan_exercises.plan_id
        AND training_plans.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 5. WORKOUT SESSIONS — logged workout instances
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id       UUID REFERENCES public.training_plans(id) ON DELETE SET NULL,
  name          TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_status ON public.workout_sessions(status);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. WORKOUT SETS — individual logged sets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id   UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number    INTEGER NOT NULL,
  weight        NUMERIC(7, 2) NOT NULL DEFAULT 0,
  reps          INTEGER NOT NULL DEFAULT 0,
  rir           INTEGER CHECK (rir >= 0 AND rir <= 10),
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_sets_session_id ON public.workout_sets(session_id);
CREATE INDEX idx_workout_sets_exercise_id ON public.workout_sets(exercise_id);

ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sets"
  ON public.workout_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = workout_sets.session_id
        AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sets"
  ON public.workout_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = workout_sets.session_id
        AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sets"
  ON public.workout_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = workout_sets.session_id
        AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own sets"
  ON public.workout_sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = workout_sets.session_id
        AND workout_sessions.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 7. WATER LOGS — daily water intake tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.water_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml     INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_water_logs_user_date ON public.water_logs(user_id, date);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own water logs"
  ON public.water_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs"
  ON public.water_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water logs"
  ON public.water_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 8. USER SETTINGS — nutrition reminders, preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_water_goal_ml INTEGER NOT NULL DEFAULT 2500,
  reminder_enabled    BOOLEAN NOT NULL DEFAULT false,
  rest_timer_seconds  INTEGER NOT NULL DEFAULT 90,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-create user_settings row when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();

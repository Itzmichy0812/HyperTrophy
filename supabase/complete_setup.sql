-- =============================================================================
-- Hypertrophy Tracker — Full Database Setup & Reset Script
-- =============================================================================
-- Script này thực hiện:
-- 1. Dọn dẹp sạch sẽ các bảng cũ / bảng thừa (users, workout_sessions, exercises...)
-- 2. Tạo đầy đủ 8 bảng chuẩn cho ứng dụng HyperTrophy Tracker
-- 3. Thiết lập Row Level Security (RLS) & Policies bảo mật
-- 4. Tạo các Triggers tự động (tạo profile và user_settings khi đăng ký)
-- 5. Backfill dữ liệu cho tài khoản auth đã đăng ký trước đó (nếu có)
-- 6. Nạp 30 bài tập mẫu mặc định
-- 7. Làm mới bộ nhớ đệm schema (PostgREST schema cache)
-- =============================================================================

-- =============================================================================
-- BƯỚC 1: DỌN DẸP BẢNG CŨ & TRIGGERS CŨ
-- =============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

DROP TABLE IF EXISTS public.workout_sets CASCADE;
DROP TABLE IF EXISTS public.plan_exercises CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.training_plans CASCADE;
DROP TABLE IF EXISTS public.water_logs CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- Bảng users cũ độc lập

-- =============================================================================
-- BƯỚC 2: TẠO 8 BẢNG CHUẨN
-- =============================================================================

-- 1. PROFILES (liên kết với auth.users)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  unit_pref     TEXT NOT NULL DEFAULT 'kg' CHECK (unit_pref IN ('kg', 'lbs')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. EXERCISES (thư viện bài tập toàn cục + bài tập riêng của user)
CREATE TABLE public.exercises (
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

-- 3. TRAINING PLANS (giáo án tập luyện)
CREATE TABLE public.training_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_plans_user_id ON public.training_plans(user_id);

-- 4. PLAN EXERCISES (danh sách bài tập trong từng giáo án)
CREATE TABLE public.plan_exercises (
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

-- 5. WORKOUT SESSIONS (phiên tập luyện thực tế)
CREATE TABLE public.workout_sessions (
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

-- 6. WORKOUT SETS (chi tiết từng hiệp tập được ghi lại)
CREATE TABLE public.workout_sets (
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

-- 7. WATER LOGS (theo dõi lượng nước uống trong ngày)
CREATE TABLE public.water_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml     INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_water_logs_user_date ON public.water_logs(user_id, date);

-- 8. USER SETTINGS (cài đặt mục tiêu nước, thời gian nghỉ)
CREATE TABLE public.user_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_water_goal_ml INTEGER NOT NULL DEFAULT 2500,
  reminder_enabled    BOOLEAN NOT NULL DEFAULT false,
  rest_timer_seconds  INTEGER NOT NULL DEFAULT 90,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- BƯỚC 3: KÍCH HOẠT ROW LEVEL SECURITY (RLS) & POLICIES
-- =============================================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view exercises" ON public.exercises FOR SELECT USING (is_custom = false OR auth.uid() = user_id);
CREATE POLICY "Users can insert custom exercises" ON public.exercises FOR INSERT WITH CHECK (auth.uid() = user_id AND is_custom = true);
CREATE POLICY "Users can update own custom exercises" ON public.exercises FOR UPDATE USING (auth.uid() = user_id AND is_custom = true);
CREATE POLICY "Users can delete own custom exercises" ON public.exercises FOR DELETE USING (auth.uid() = user_id AND is_custom = true);

-- Training Plans
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own plans" ON public.training_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.training_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.training_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.training_plans FOR DELETE USING (auth.uid() = user_id);

-- Plan Exercises
ALTER TABLE public.plan_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own plan exercises" ON public.plan_exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.training_plans WHERE training_plans.id = plan_exercises.plan_id AND training_plans.user_id = auth.uid())
);
CREATE POLICY "Users can insert own plan exercises" ON public.plan_exercises FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.training_plans WHERE training_plans.id = plan_exercises.plan_id AND training_plans.user_id = auth.uid())
);
CREATE POLICY "Users can update own plan exercises" ON public.plan_exercises FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.training_plans WHERE training_plans.id = plan_exercises.plan_id AND training_plans.user_id = auth.uid())
);
CREATE POLICY "Users can delete own plan exercises" ON public.plan_exercises FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.training_plans WHERE training_plans.id = plan_exercises.plan_id AND training_plans.user_id = auth.uid())
);

-- Workout Sessions
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- Workout Sets
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sets" ON public.workout_sets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = workout_sets.session_id AND workout_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can insert own sets" ON public.workout_sets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = workout_sets.session_id AND workout_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can update own sets" ON public.workout_sets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = workout_sets.session_id AND workout_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can delete own sets" ON public.workout_sets FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = workout_sets.session_id AND workout_sessions.user_id = auth.uid())
);

-- Water Logs
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own water logs" ON public.water_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own water logs" ON public.water_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own water logs" ON public.water_logs FOR UPDATE USING (auth.uid() = user_id);

-- User Settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- BƯỚC 4: TRIGGERS TỰ ĐỘNG KHỞI TẠO PROFILE VÀ CÀI ĐẶT KHI SIGN UP
-- =============================================================================

-- Tự tạo profile khi có user mới trong auth.users
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Tự tạo user_settings khi có profile mới
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();

-- =============================================================================
-- BƯỚC 5: BACKFILL CHO CÁC TÀI KHOẢN ĐÃ ĐĂNG KÝ TRƯỚC ĐÓ (NẾU CÓ)
-- =============================================================================
INSERT INTO public.profiles (id, display_name)
SELECT id, COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_settings (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- BƯỚC 6: NẠP 30 BÀI TẬP MẪU MẶC ĐỊNH (SEED DATA)
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

-- =============================================================================
-- BƯỚC 7: THÔNG BÁO POSTGREST LÀM MỚI SCHEMA CACHE NGAY LẬP TỨC
-- =============================================================================
NOTIFY pgrst, 'reload schema';

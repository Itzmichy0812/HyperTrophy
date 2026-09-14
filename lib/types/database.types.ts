// =============================================================================
// Hypertrophy Tracker — Database TypeScript Types
// =============================================================================
// Hand-written to match supabase/migrations/0001_init_schema.sql.
// Keep these in sync — update both together when the schema changes.
// Can be replaced later by `supabase gen types typescript`.
// =============================================================================

export type UnitPref = 'kg' | 'lbs';
export type SessionStatus = 'active' | 'completed' | 'cancelled';
export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Quads'
  | 'Hamstrings'
  | 'Arms'
  | 'Core';

// ---------------------------------------------------------------------------
// Row types (what comes back from Supabase queries)
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  display_name: string | null;
  unit_pref: UnitPref;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanExercise {
  id: string;
  plan_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: number;
  target_rir: number;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id: string | null;
  name: string | null;
  status: SessionStatus;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir: number | null;
  logged_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  date: string;
  amount_ml: number;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  daily_water_goal_ml: number;
  reminder_enabled: boolean;
  rest_timer_seconds: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Insert types (what you pass to Supabase .insert())
// ---------------------------------------------------------------------------

export interface ProfileInsert {
  id: string;
  display_name?: string | null;
  unit_pref?: UnitPref;
}

export interface ExerciseInsert {
  name: string;
  muscle_group: MuscleGroup;
  is_custom?: boolean;
  user_id?: string | null;
}

export interface TrainingPlanInsert {
  user_id: string;
  name: string;
  is_active?: boolean;
}

export interface PlanExerciseInsert {
  plan_id: string;
  exercise_id: string;
  sort_order?: number;
  target_sets?: number;
  target_reps?: number;
  target_rir?: number;
}

export interface WorkoutSessionInsert {
  user_id: string;
  plan_id?: string | null;
  name?: string | null;
  status?: SessionStatus;
  notes?: string | null;
}

export interface WorkoutSetInsert {
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir?: number | null;
}

export interface WaterLogInsert {
  user_id: string;
  date?: string;
  amount_ml: number;
}

export interface UserSettingsInsert {
  user_id: string;
  daily_water_goal_ml?: number;
  reminder_enabled?: boolean;
  rest_timer_seconds?: number;
}

// ---------------------------------------------------------------------------
// Update types (partial updates)
// ---------------------------------------------------------------------------

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;
export type ExerciseUpdate = Partial<Omit<Exercise, 'id' | 'created_at' | 'user_id'>>;
export type TrainingPlanUpdate = Partial<Omit<TrainingPlan, 'id' | 'user_id' | 'created_at'>>;
export type PlanExerciseUpdate = Partial<Omit<PlanExercise, 'id' | 'plan_id' | 'created_at'>>;
export type WorkoutSessionUpdate = Partial<Omit<WorkoutSession, 'id' | 'user_id' | 'created_at'>>;
export type WorkoutSetUpdate = Partial<Omit<WorkoutSet, 'id' | 'session_id'>>;
export type WaterLogUpdate = Partial<Pick<WaterLog, 'amount_ml'>>;
export type UserSettingsUpdate = Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at'>>;

// ---------------------------------------------------------------------------
// Joined / enriched types for common query patterns
// ---------------------------------------------------------------------------

export interface PlanExerciseWithDetails extends PlanExercise {
  exercise: Exercise;
}

export interface TrainingPlanWithExercises extends TrainingPlan {
  plan_exercises: PlanExerciseWithDetails[];
}

export interface WorkoutSetWithExercise extends WorkoutSet {
  exercise: Exercise;
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  workout_sets: WorkoutSetWithExercise[];
}

/** Data point for the exercise 1RM progress chart (read-only query result). */
export interface ExerciseProgressDataPoint {
  date: string;
  estimated1RM: number;
  weight: number;
  reps: number;
}

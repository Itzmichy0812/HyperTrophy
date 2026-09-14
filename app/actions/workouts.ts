'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function startWorkoutAction(planId?: string, name?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      plan_id: planId || null,
      name: name || 'Workout',
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to start workout: ${error.message}`);

  return data;
}

export async function logSetAction(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
  rir?: number | null,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('workout_sets')
    .insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      set_number: setNumber,
      weight,
      reps,
      rir: rir ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to log set: ${error.message}`);

  return data;
}

export async function updateSetAction(
  setId: string,
  data: { weight?: number; reps?: number; rir?: number | null },
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('workout_sets')
    .update(data)
    .eq('id', setId);

  if (error) throw new Error(`Failed to update set: ${error.message}`);
}

export async function deleteSetAction(setId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('workout_sets')
    .delete()
    .eq('id', setId);

  if (error) throw new Error(`Failed to delete set: ${error.message}`);
}

export async function finishWorkoutAction(sessionId: string, notes?: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('workout_sessions')
    .update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      notes: notes || null,
    })
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to finish workout: ${error.message}`);

  revalidatePath('/workouts');
  revalidatePath('/dashboard');
}

export async function cancelWorkoutAction(sessionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('workout_sessions')
    .update({
      status: 'cancelled',
      finished_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to cancel workout: ${error.message}`);

  revalidatePath('/workouts');
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPlanAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const name = formData.get('name') as string;
  if (!name) throw new Error('Plan name is required');

  const { data, error } = await supabase
    .from('training_plans')
    .insert({ user_id: user.id, name })
    .select()
    .single();

  if (error) throw new Error(`Failed to create plan: ${error.message}`);

  revalidatePath('/plans');
  redirect(`/plans/${data.id}`);
}

export async function updatePlanAction(planId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const name = formData.get('name') as string;

  const { error } = await supabase
    .from('training_plans')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to update plan: ${error.message}`);

  revalidatePath('/plans');
  revalidatePath(`/plans/${planId}`);
}

export async function deletePlanAction(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('training_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to delete plan: ${error.message}`);

  revalidatePath('/plans');
}

export async function duplicatePlanAction(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Fetch the original plan
  const { data: plan, error: planError } = await supabase
    .from('training_plans')
    .select('*, plan_exercises(*)')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single();

  if (planError || !plan) throw new Error('Plan not found');

  // Create the duplicate
  const { data: newPlan, error: createError } = await supabase
    .from('training_plans')
    .insert({
      user_id: user.id,
      name: `${plan.name} (Copy)`,
      is_active: false,
    })
    .select()
    .single();

  if (createError || !newPlan) throw new Error('Failed to duplicate plan');

  // Copy exercises
  if (plan.plan_exercises && plan.plan_exercises.length > 0) {
    const exerciseCopies = plan.plan_exercises.map(
      (pe: { exercise_id: string; sort_order: number; target_sets: number; target_reps: number; target_rir: number }) => ({
        plan_id: newPlan.id,
        exercise_id: pe.exercise_id,
        sort_order: pe.sort_order,
        target_sets: pe.target_sets,
        target_reps: pe.target_reps,
        target_rir: pe.target_rir,
      }),
    );

    const { error: exError } = await supabase
      .from('plan_exercises')
      .insert(exerciseCopies);

    if (exError) throw new Error(`Failed to copy exercises: ${exError.message}`);
  }

  revalidatePath('/plans');
}

export async function setActivePlanAction(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Deactivate all plans
  await supabase
    .from('training_plans')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  // Activate the selected plan
  const { error } = await supabase
    .from('training_plans')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to set active plan: ${error.message}`);

  revalidatePath('/plans');
  revalidatePath('/dashboard');
}

export async function addExerciseToPlanAction(
  planId: string,
  exerciseId: string,
  sortOrder: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('plan_exercises').insert({
    plan_id: planId,
    exercise_id: exerciseId,
    sort_order: sortOrder,
  });

  if (error) throw new Error(`Failed to add exercise: ${error.message}`);

  revalidatePath(`/plans/${planId}`);
}

export async function removeExerciseFromPlanAction(planExerciseId: string, planId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('plan_exercises')
    .delete()
    .eq('id', planExerciseId);

  if (error) throw new Error(`Failed to remove exercise: ${error.message}`);

  revalidatePath(`/plans/${planId}`);
}

export async function reorderPlanExercisesAction(
  planId: string,
  orderedIds: { id: string; sort_order: number }[],
) {
  const supabase = await createClient();

  // Update each plan exercise sort order
  for (const item of orderedIds) {
    const { error } = await supabase
      .from('plan_exercises')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id);

    if (error) throw new Error(`Failed to reorder: ${error.message}`);
  }

  revalidatePath(`/plans/${planId}`);
}

export async function updatePlanExerciseAction(
  planExerciseId: string,
  planId: string,
  data: { target_sets?: number; target_reps?: number; target_rir?: number },
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('plan_exercises')
    .update(data)
    .eq('id', planExerciseId);

  if (error) throw new Error(`Failed to update exercise: ${error.message}`);

  revalidatePath(`/plans/${planId}`);
}

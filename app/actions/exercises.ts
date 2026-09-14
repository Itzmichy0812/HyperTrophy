'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { MuscleGroup } from '@/lib/types/database.types';

export async function createExerciseAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const name = formData.get('name') as string;
  const muscleGroup = formData.get('muscle_group') as MuscleGroup;

  if (!name || !muscleGroup) {
    throw new Error('Name and muscle group are required');
  }

  const { error } = await supabase.from('exercises').insert({
    name,
    muscle_group: muscleGroup,
    is_custom: true,
    user_id: user.id,
  });

  if (error) {
    throw new Error(`Failed to create exercise: ${error.message}`);
  }

  revalidatePath('/exercises');
}

export async function deleteExerciseAction(exerciseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', exerciseId)
    .eq('user_id', user.id)
    .eq('is_custom', true);

  if (error) {
    throw new Error(`Failed to delete exercise: ${error.message}`);
  }

  revalidatePath('/exercises');
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addWaterAction(amountMl: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];

  // Upsert: increment today's water log
  const { data: existing } = await supabase
    .from('water_logs')
    .select('id, amount_ml')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('water_logs')
      .update({ amount_ml: existing.amount_ml + amountMl })
      .eq('id', existing.id);

    if (error) throw new Error(`Failed to add water: ${error.message}`);
  } else {
    const { error } = await supabase.from('water_logs').insert({
      user_id: user.id,
      date: today,
      amount_ml: amountMl,
    });

    if (error) throw new Error(`Failed to add water: ${error.message}`);
  }

  revalidatePath('/dashboard');
}

export async function getWaterTodayAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { amount_ml: 0 };

  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  return { amount_ml: data?.amount_ml ?? 0 };
}

export async function updateWaterGoalAction(goalMl: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_settings')
    .update({
      daily_water_goal_ml: goalMl,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to update water goal: ${error.message}`);

  revalidatePath('/dashboard');
}

export async function updateReminderSettingsAction(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_settings')
    .update({
      reminder_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to update reminder: ${error.message}`);
}

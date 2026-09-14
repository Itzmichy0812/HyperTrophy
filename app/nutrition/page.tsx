import { createClient } from '@/lib/supabase/server';
import { WaterTrackerWidget } from '@/components/nutrition/WaterTrackerWidget';
import { updateWaterGoalAction, updateReminderSettingsAction } from '@/app/actions/nutrition';

export default async function NutritionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];

  const { data: waterToday } = await supabase
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const currentMl = waterToday?.amount_ml ?? 0;
  const goalMl = settings?.daily_water_goal_ml ?? 2500;
  const reminderEnabled = settings?.reminder_enabled ?? false;

  return (
    <div className="flex-1 space-y-6 p-4 pb-24">
      <h1 className="text-2xl font-bold">Nutrition & Hydration</h1>

      {/* Water Tracker */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Today&apos;s Water Intake
        </h2>
        <WaterTrackerWidget currentMl={currentMl} goalMl={goalMl} />
      </div>

      {/* Settings */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Settings
        </h2>

        {/* Daily water goal */}
        <form
          action={async (formData: FormData) => {
            'use server';
            const goal = parseInt(formData.get('goal') as string);
            if (goal > 0) await updateWaterGoalAction(goal);
          }}
          className="flex items-end gap-3"
        >
          <div className="flex-1 space-y-1">
            <label htmlFor="goal" className="text-sm font-medium">
              Daily Water Goal (ml)
            </label>
            <input
              id="goal"
              name="goal"
              type="number"
              defaultValue={goalMl}
              min={500}
              max={10000}
              step={100}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save
          </button>
        </form>

        {/* Reminder toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Hydration Reminders</p>
            <p className="text-xs text-muted-foreground">
              {reminderEnabled ? 'Enabled' : 'Disabled'} (config only — no
              push notifications in MVP)
            </p>
          </div>
          <form
            action={async () => {
              'use server';
              await updateReminderSettingsAction(!reminderEnabled);
            }}
          >
            <button
              type="submit"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                reminderEnabled ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

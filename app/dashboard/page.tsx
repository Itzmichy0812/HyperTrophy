import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { signOutAction } from '@/app/actions/auth';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch active plan
  const { data: activePlan } = await supabase
    .from('training_plans')
    .select('*, plan_exercises(*, exercise:exercises(name, muscle_group))')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  // Weekly summary
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const { data: weekSessions } = await supabase
    .from('workout_sessions')
    .select('id, finished_at, workout_sets(count)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('finished_at', weekStart.toISOString())
    .lte('finished_at', weekEnd.toISOString());

  const weekSessionCount = weekSessions?.length ?? 0;
  const weekTotalSets = weekSessions?.reduce(
    (acc, s) => acc + (s.workout_sets?.[0]?.count ?? 0),
    0,
  ) ?? 0;

  // Recent sessions
  const { data: recentSessions } = await supabase
    .from('workout_sessions')
    .select('id, name, finished_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('finished_at', { ascending: false })
    .limit(5);

  // Today's water
  const today = new Date().toISOString().split('T')[0];
  const { data: waterToday } = await supabase
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('daily_water_goal_ml')
    .eq('user_id', user.id)
    .single();

  const waterMl = waterToday?.amount_ml ?? 0;
  const waterGoal = settings?.daily_water_goal_ml ?? 2500;
  const waterPercent = Math.min(100, Math.round((waterMl / waterGoal) * 100));

  return (
    <div className="flex-1 space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hey, {profile?.display_name || 'Lifter'} 💪
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            Sign Out
          </button>
        </form>
      </div>

      {/* Start Workout CTA */}
      <Link
        href="/workouts/active"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary p-4 text-lg font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        🏋️ Start Workout
      </Link>

      {/* Today's Focus */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Today&apos;s Focus
        </h2>
        {activePlan ? (
          <div>
            <p className="font-semibold text-lg">{activePlan.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activePlan.plan_exercises
                ?.sort(
                  (a: { sort_order: number }, b: { sort_order: number }) =>
                    a.sort_order - b.sort_order,
                )
                .slice(0, 6)
                .map(
                  (pe: {
                    exercise: { name: string; muscle_group: string };
                  }, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      {pe.exercise.name}
                    </span>
                  ),
                )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No active plan.{' '}
            <Link href="/plans" className="text-primary underline">
              Create one
            </Link>
          </p>
        )}
      </div>

      {/* Weekly Summary */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          This Week
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-bold tabular-nums">
              {weekSessionCount}
            </p>
            <p className="text-sm text-muted-foreground">Workouts</p>
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums">
              {weekTotalSets}
            </p>
            <p className="text-sm text-muted-foreground">Total Sets</p>
          </div>
        </div>
      </div>

      {/* Water Tracker */}
      <Link
        href="/nutrition"
        className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
      >
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Hydration
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                className="text-secondary"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                className="text-blue-500"
                strokeWidth="3"
                strokeDasharray={`${waterPercent}, 100`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {waterPercent}%
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold">
              {waterMl}ml / {waterGoal}ml
            </p>
            <p className="text-sm text-muted-foreground">Daily Goal · Tap to log</p>
          </div>
        </div>
      </Link>

      {/* Recent Activity */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Activity
        </h2>
        {recentSessions && recentSessions.length > 0 ? (
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/workouts/${session.id}`}
                className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
              >
                <span className="text-sm font-medium">
                  {session.name || 'Workout'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session.finished_at
                    ? format(new Date(session.finished_at), 'MMM d')
                    : ''}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No workouts yet. Get started!
          </p>
        )}
      </div>
    </div>
  );
}

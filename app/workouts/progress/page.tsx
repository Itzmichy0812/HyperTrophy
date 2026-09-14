import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { calculate1RM } from '@/lib/utils/formatters';
import { ExerciseProgressChart } from '@/components/history/ExerciseProgressChart';
import type { ExerciseProgressDataPoint } from '@/lib/types/database.types';
import { ExerciseSelector } from './exercise-selector';

interface ProgressPageProps {
  searchParams: Promise<{ exercise?: string }>;
}

export default async function ProgressPage({
  searchParams,
}: ProgressPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch distinct exercises that have completed sets for this user
  const { data: exerciseSets } = await supabase
    .from('workout_sets')
    .select(
      'exercise_id, exercise:exercises(id, name, muscle_group), session:workout_sessions!inner(user_id, status)',
    )
    .eq('session.user_id', user.id)
    .eq('session.status', 'completed');

  // Deduplicate to get distinct exercises
  const exerciseMap = new Map<
    string,
    { id: string; name: string; muscle_group: string }
  >();

  for (const row of exerciseSets ?? []) {
    const ex = row.exercise as unknown as {
      id: string;
      name: string;
      muscle_group: string;
    };
    if (ex && !exerciseMap.has(ex.id)) {
      exerciseMap.set(ex.id, ex);
    }
  }

  const exerciseOptions = Array.from(exerciseMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const selectedExerciseId = params.exercise ?? exerciseOptions[0]?.id ?? null;
  const selectedExercise = selectedExerciseId
    ? exerciseMap.get(selectedExerciseId)
    : null;

  // Fetch 1RM progress data for the selected exercise
  let chartData: ExerciseProgressDataPoint[] = [];

  if (selectedExerciseId) {
    const { data: sets } = await supabase
      .from('workout_sets')
      .select(
        'weight, reps, session:workout_sessions!inner(user_id, status, finished_at)',
      )
      .eq('exercise_id', selectedExerciseId)
      .eq('session.user_id', user.id)
      .eq('session.status', 'completed')
      .order('logged_at', { ascending: true });

    if (sets) {
      // Group by session date and take the best 1RM per session
      const byDate = new Map<
        string,
        { best1RM: number; weight: number; reps: number }
      >();

      for (const set of sets) {
        const session = set.session as unknown as {
          finished_at: string;
        };
        const dateKey = format(
          new Date(session.finished_at),
          'MMM d',
        );
        const est1RM = calculate1RM(set.weight, set.reps);

        const existing = byDate.get(dateKey);
        if (!existing || est1RM > existing.best1RM) {
          byDate.set(dateKey, {
            best1RM: est1RM,
            weight: set.weight,
            reps: set.reps,
          });
        }
      }

      chartData = Array.from(byDate.entries()).map(([date, val]) => ({
        date,
        estimated1RM: val.best1RM,
        weight: val.weight,
        reps: val.reps,
      }));
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/workouts"
          className="rounded-md p-2 text-muted-foreground hover:bg-accent"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Exercise Progress</h1>
      </div>

      {exerciseOptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground">
            No completed workout data yet. Finish a workout to see your
            progress!
          </p>
          <Link
            href="/workouts/active"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start Workout
          </Link>
        </div>
      ) : (
        <>
          {/* Exercise selector */}
          <ExerciseSelector
            exercises={exerciseOptions}
            selectedId={selectedExerciseId}
          />

          {/* Chart */}
          <ExerciseProgressChart
            data={chartData}
            exerciseName={selectedExercise?.name ?? ''}
          />

          {/* Summary stats */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">
                  {chartData[chartData.length - 1].estimated1RM}
                </p>
                <p className="text-xs text-muted-foreground">Current 1RM</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">
                  {Math.max(...chartData.map((d) => d.estimated1RM))}
                </p>
                <p className="text-xs text-muted-foreground">Peak 1RM</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">
                  {chartData.length}
                </p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

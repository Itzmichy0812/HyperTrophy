import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { calculate1RM } from '@/lib/utils/formatters';

interface SessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('workout_sessions')
    .select('*, workout_sets(*, exercise:exercises(id, name, muscle_group))')
    .eq('id', id)
    .single();

  if (!session) notFound();

  // Group sets by exercise
  const setsByExercise = new Map<
    string,
    {
      exercise: { id: string; name: string; muscle_group: string };
      sets: {
        set_number: number;
        weight: number;
        reps: number;
        rir: number | null;
      }[];
    }
  >();

  for (const ws of session.workout_sets ?? []) {
    const key = ws.exercise.id;
    if (!setsByExercise.has(key)) {
      setsByExercise.set(key, { exercise: ws.exercise, sets: [] });
    }
    setsByExercise.get(key)!.sets.push({
      set_number: ws.set_number,
      weight: ws.weight,
      reps: ws.reps,
      rir: ws.rir,
    });
  }

  // Sort sets within each exercise
  for (const group of setsByExercise.values()) {
    group.sets.sort((a, b) => a.set_number - b.set_number);
  }

  const duration =
    session.started_at && session.finished_at
      ? Math.round(
          (new Date(session.finished_at).getTime() -
            new Date(session.started_at).getTime()) /
            60000,
        )
      : null;

  return (
    <div className="flex-1 space-y-6 p-4 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/workouts"
          className="rounded-md p-2 text-muted-foreground hover:bg-accent"
        >
          ← Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{session.name || 'Workout'}</h1>
          <p className="text-sm text-muted-foreground">
            {session.finished_at
              ? format(new Date(session.finished_at), 'EEEE, MMMM d, yyyy')
              : 'In progress'}
            {duration && ` · ${duration} min`}
          </p>
        </div>
      </div>

      {session.notes && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{session.notes}</p>
        </div>
      )}

      <div className="space-y-4">
        {Array.from(setsByExercise.entries()).map(
          ([exerciseId, { exercise, sets }]) => (
            <div
              key={exerciseId}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-semibold">{exercise.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {exercise.muscle_group}
                </span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>RIR</span>
                <span>Est. 1RM</span>
              </div>

              {sets.map((set) => (
                <div
                  key={set.set_number}
                  className="grid grid-cols-5 gap-2 px-4 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {set.set_number}
                  </span>
                  <span className="tabular-nums">{set.weight}</span>
                  <span className="tabular-nums">{set.reps}</span>
                  <span className="tabular-nums">
                    {set.rir !== null ? set.rir : '-'}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {calculate1RM(set.weight, set.reps) || '-'}
                  </span>
                </div>
              ))}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

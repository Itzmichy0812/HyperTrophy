import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function WorkoutsPage() {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('*, workout_sets(count)')
    .eq('status', 'completed')
    .order('finished_at', { ascending: false })
    .limit(50);

  return (
    <div className="flex-1 space-y-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout History</h1>
        <div className="flex gap-2">
          <Link
            href="/workouts/progress"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Progress
          </Link>
          <Link
            href="/workouts/active"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start Workout
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {sessions?.map((session) => {
          const setCount = session.workout_sets?.[0]?.count ?? 0;
          const finishedDate = session.finished_at
            ? format(new Date(session.finished_at), 'EEE, MMM d, yyyy')
            : 'In progress';
          const duration =
            session.started_at && session.finished_at
              ? Math.round(
                  (new Date(session.finished_at).getTime() -
                    new Date(session.started_at).getTime()) /
                    60000,
                )
              : null;

          return (
            <Link
              key={session.id}
              href={`/workouts/${session.id}`}
              className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {session.name || 'Workout'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {finishedDate}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{setCount} sets</p>
                  {duration && <p>{duration} min</p>}
                </div>
              </div>
            </Link>
          );
        })}
        {(!sessions || sessions.length === 0) && (
          <p className="text-center text-muted-foreground py-12">
            No completed workouts yet. Start your first one!
          </p>
        )}
      </div>
    </div>
  );
}

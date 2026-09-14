import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import {
  addExerciseToPlanAction,
  removeExerciseFromPlanAction,
  updatePlanExerciseAction,
} from '@/app/actions/plans';
import Link from 'next/link';

interface PlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch plan with exercises
  const { data: plan } = await supabase
    .from('training_plans')
    .select(
      '*, plan_exercises(*, exercise:exercises(id, name, muscle_group))',
    )
    .eq('id', id)
    .single();

  if (!plan) notFound();

  // Fetch all exercises for the picker
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('*')
    .order('muscle_group')
    .order('name');

  const sortedPlanExercises = (plan.plan_exercises ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) =>
      a.sort_order - b.sort_order,
  );

  return (
    <div className="flex-1 space-y-6 p-4 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/plans"
          className="rounded-md p-2 text-muted-foreground hover:bg-accent"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">{plan.name}</h1>
        {plan.is_active && (
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
            Active
          </span>
        )}
      </div>

      {/* Plan exercises */}
      <div className="space-y-3">
        {sortedPlanExercises.map(
          (pe: {
            id: string;
            sort_order: number;
            target_sets: number;
            target_reps: number;
            target_rir: number;
            exercise: { id: string; name: string; muscle_group: string };
          }) => (
            <div
              key={pe.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{pe.exercise.name}</p>
                  <span className="inline-block mt-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {pe.exercise.muscle_group}
                  </span>
                </div>
                <form
                  action={async () => {
                    'use server';
                    await removeExerciseFromPlanAction(pe.id, id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </button>
                </form>
              </div>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span>{pe.target_sets} sets</span>
                <span>{pe.target_reps} reps</span>
                <span>RIR {pe.target_rir}</span>
              </div>
            </div>
          ),
        )}
        {sortedPlanExercises.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No exercises in this plan yet. Add some below!
          </p>
        )}
      </div>

      {/* Add exercise picker */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Add Exercise to Plan</h2>
        <form
          action={async (formData: FormData) => {
            'use server';
            const exerciseId = formData.get('exercise_id') as string;
            const sortOrder = sortedPlanExercises.length;
            await addExerciseToPlanAction(id, exerciseId, sortOrder);
          }}
          className="flex flex-col gap-3"
        >
          <select
            name="exercise_id"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select an exercise</option>
            {allExercises?.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.muscle_group})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add to Plan
          </button>
        </form>
      </div>
    </div>
  );
}

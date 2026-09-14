import { createClient } from '@/lib/supabase/server';
import { createExerciseAction } from '@/app/actions/exercises';
import Link from 'next/link';
import type { MuscleGroup } from '@/lib/types/database.types';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Quads',
  'Hamstrings',
  'Arms',
  'Core',
];

interface ExercisesPageProps {
  searchParams: Promise<{ q?: string; muscle?: string }>;
}

export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('exercises')
    .select('*')
    .order('muscle_group')
    .order('name');

  if (params.muscle && params.muscle !== 'All') {
    query = query.eq('muscle_group', params.muscle);
  }

  if (params.q) {
    query = query.ilike('name', `%${params.q}%`);
  }

  const { data: exercises } = await query;

  return (
    <div className="flex-1 space-y-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercises</h1>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <input
          name="q"
          type="search"
          placeholder="Search exercises..."
          defaultValue={params.q}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input type="hidden" name="muscle" value={params.muscle ?? 'All'} />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      {/* Muscle group filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/exercises?muscle=All${params.q ? `&q=${params.q}` : ''}`}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            !params.muscle || params.muscle === 'All'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          All
        </Link>
        {MUSCLE_GROUPS.map((group) => (
          <Link
            key={group}
            href={`/exercises?muscle=${group}${params.q ? `&q=${params.q}` : ''}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              params.muscle === group
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {group}
          </Link>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {exercises?.map((exercise) => (
          <div
            key={exercise.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          >
            <div>
              <p className="font-medium">{exercise.name}</p>
              <span className="inline-block mt-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {exercise.muscle_group}
              </span>
            </div>
            {exercise.is_custom && (
              <span className="text-xs text-muted-foreground">Custom</span>
            )}
          </div>
        ))}
        {exercises?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No exercises found.
          </p>
        )}
      </div>

      {/* Add Custom Exercise */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Add Custom Exercise</h2>
        <form action={createExerciseAction} className="flex flex-col gap-3">
          <input
            name="name"
            type="text"
            placeholder="Exercise name"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <select
            name="muscle_group"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select muscle group</option>
            {MUSCLE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Exercise
          </button>
        </form>
      </div>
    </div>
  );
}

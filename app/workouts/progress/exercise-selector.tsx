'use client';

import { useRouter } from 'next/navigation';

interface ExerciseSelectorProps {
  exercises: { id: string; name: string; muscle_group: string }[];
  selectedId: string | null;
}

export function ExerciseSelector({
  exercises,
  selectedId,
}: ExerciseSelectorProps) {
  const router = useRouter();

  return (
    <div className="space-y-1">
      <label
        htmlFor="exercise-select"
        className="text-sm font-medium text-muted-foreground"
      >
        Select exercise
      </label>
      <select
        id="exercise-select"
        value={selectedId ?? ''}
        onChange={(e) => {
          router.push(`/workouts/progress?exercise=${e.target.value}`);
        }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name} ({ex.muscle_group})
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ExercisesLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 pb-24 animate-pulse">
      <div className="h-7 w-28 rounded bg-muted" />

      {/* Search skeleton */}
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-md bg-muted" />
        <div className="h-10 w-20 rounded-md bg-muted" />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-muted" />
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 w-36 rounded bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

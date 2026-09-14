export default function PlansLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 pb-24 animate-pulse">
      <div className="h-7 w-36 rounded bg-muted" />

      {/* Create form skeleton */}
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-md bg-muted" />
        <div className="h-10 w-20 rounded-md bg-muted" />
      </div>

      {/* Plans list */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-4 w-24 rounded bg-muted" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-9 w-20 rounded bg-muted" />
                <div className="h-9 w-20 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkoutsLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 pb-24 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-lg bg-muted" />
          <div className="h-9 w-28 rounded-lg bg-muted" />
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex justify-between">
              <div className="space-y-1.5">
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-4 w-40 rounded bg-muted" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="h-4 w-12 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

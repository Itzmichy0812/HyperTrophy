export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 pb-24 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
        <div className="h-8 w-20 rounded bg-muted" />
      </div>

      {/* CTA skeleton */}
      <div className="h-14 w-full rounded-xl bg-muted" />

      {/* Cards */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-8 w-40 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function FeedLoading() {
  return (
    <div className="flex gap-5 max-w-6xl mx-auto">
      {/* Left sidebar skeleton */}
      <aside className="hidden lg:block w-[220px] shrink-0">
        <div className="rounded-xl bg-card border border-border p-0 overflow-hidden">
          <div className="h-16 bg-background animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="w-16 h-16 rounded-full bg-background animate-pulse -mt-10" />
            <div className="h-4 bg-background rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-background rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Center feed skeleton */}
      <div className="flex-1 min-w-0 max-w-2xl space-y-4">
        {/* Composer skeleton */}
        <div className="rounded-xl bg-card border border-border p-4 animate-pulse">
          <div className="h-20 bg-background rounded-lg" />
        </div>

        {/* Post skeletons */}
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl bg-card border border-border p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-background rounded w-32" />
                <div className="h-3 bg-background rounded w-20" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-background rounded w-full" />
              <div className="h-3 bg-background rounded w-5/6" />
              <div className="h-3 bg-background rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>

      {/* Right sidebar skeleton */}
      <aside className="hidden xl:block w-[260px] shrink-0">
        <div className="space-y-3">
          <div className="rounded-xl bg-card border border-border p-4 animate-pulse">
            <div className="h-3 bg-background rounded w-24 mb-3" />
            <div className="space-y-2">
              <div className="h-8 bg-background rounded" />
              <div className="h-8 bg-background rounded" />
              <div className="h-8 bg-background rounded" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

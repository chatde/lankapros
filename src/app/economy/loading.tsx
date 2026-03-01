export default function EconomyLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-4 space-y-2">
            <div className="h-3 w-20 bg-border rounded" />
            <div className="h-7 w-28 bg-border rounded" />
            <div className="h-3 w-16 bg-border rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-card border border-border p-4 h-[300px]" />
    </div>
  )
}

export default function PostCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
      {/* Author header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-border shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-border rounded-full w-32" />
          <div className="h-3 bg-border rounded-full w-48" />
        </div>
      </div>
      {/* Content lines */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-border rounded-full w-full" />
        <div className="h-3 bg-border rounded-full w-[85%]" />
        <div className="h-3 bg-border rounded-full w-[70%]" />
      </div>
      {/* Actions bar */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <div className="h-3 bg-border rounded-full w-10" />
        <div className="h-3 bg-border rounded-full w-14" />
      </div>
    </div>
  )
}

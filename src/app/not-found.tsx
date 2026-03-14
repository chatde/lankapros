import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <span className="text-black font-bold text-base">LP</span>
        </div>
        <span className="font-bold text-xl">Lanka<span className="text-accent">Pros</span></span>
      </Link>

      <div className="text-center max-w-md space-y-4">
        <p className="text-7xl font-bold text-accent">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted text-sm">
          This page doesn&apos;t exist or may have been removed.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/feed"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-black font-medium text-sm hover:bg-accent/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to feed
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-card border border-border text-foreground font-medium text-sm hover:bg-card/80 transition-colors"
          >
            <Search className="h-4 w-4" />
            Search LankaPros
          </Link>
        </div>
      </div>
    </div>
  )
}

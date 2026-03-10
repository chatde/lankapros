'use client'

import Link from 'next/link'

export default function EmptyFeedState() {
  return (
    <div className="flex flex-col items-center py-16 px-4">
      {/* SVG illustration */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
        className="mb-6 opacity-80"
      >
        {/* Background circle */}
        <circle cx="60" cy="60" r="56" fill="#D4A843" fillOpacity="0.08" stroke="#D4A843" strokeOpacity="0.25" strokeWidth="1.5" />
        {/* Stylised lotus / network nodes */}
        <circle cx="60" cy="44" r="10" fill="#D4A843" fillOpacity="0.3" />
        <circle cx="41" cy="67" r="8" fill="#D4A843" fillOpacity="0.2" />
        <circle cx="79" cy="67" r="8" fill="#D4A843" fillOpacity="0.2" />
        <circle cx="60" cy="82" r="6" fill="#D4A843" fillOpacity="0.15" />
        {/* Lines connecting nodes */}
        <line x1="60" y1="54" x2="41" y2="67" stroke="#D4A843" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="60" y1="54" x2="79" y2="67" stroke="#D4A843" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="41" y1="75" x2="60" y2="82" stroke="#D4A843" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="79" y1="75" x2="60" y2="82" stroke="#D4A843" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
        {/* Centre dot */}
        <circle cx="60" cy="44" r="4" fill="#D4A843" fillOpacity="0.7" />
      </svg>

      <h2 className="text-xl font-bold text-foreground mb-2 text-center">
        Your feed is quiet right now
      </h2>
      <p className="text-sm text-muted text-center max-w-xs mb-8">
        Follow Sri Lankan professionals to see their updates here.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/connections"
          className="inline-flex items-center justify-center rounded-lg font-medium transition-colors h-10 px-4 text-sm bg-[#D4A843] text-black hover:bg-[#c49535]"
        >
          Discover People
        </Link>
        <Link
          href="/economy"
          className="inline-flex items-center justify-center rounded-lg font-medium transition-colors h-10 px-4 text-sm bg-card text-foreground border border-border hover:bg-card-hover"
        >
          Explore Economy
        </Link>
      </div>

      {/* Skeleton placeholder cards — visual weight */}
      <div className="mt-10 w-full max-w-lg space-y-3">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="rounded-xl bg-card border border-border p-4 animate-pulse"
            style={{ opacity: 1 - i * 0.2 }}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-border shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-32 rounded bg-border" />
                <div className="h-2.5 w-24 rounded bg-border/60" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-2.5 w-full rounded bg-border/60" />
              <div className="h-2.5 w-5/6 rounded bg-border/60" />
              <div className="h-2.5 w-3/4 rounded bg-border/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
      <p className="text-xl font-semibold text-foreground">Something went wrong</p>
      <p className="text-sm text-muted max-w-sm">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg font-medium transition-colors h-10 px-4 text-sm bg-[#D4A843] text-black hover:bg-[#c49535]"
        >
          Try again
        </button>
        <Link
          href="/feed"
          className="inline-flex items-center justify-center rounded-lg font-medium transition-colors h-10 px-4 text-sm bg-card text-foreground border border-border hover:bg-card-hover"
        >
          Go to Feed
        </Link>
      </div>
    </div>
  )
}

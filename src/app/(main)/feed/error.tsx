'use client'

import { useEffect } from 'react'
import Button from '@/components/ui/Button'

export default function FeedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Feed Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
      <p className="text-foreground font-semibold">Something went wrong loading your feed.</p>
      <p className="text-sm text-muted">{error.message || 'An unexpected error occurred.'}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}

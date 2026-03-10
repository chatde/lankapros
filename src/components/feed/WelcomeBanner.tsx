'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import Card from '@/components/ui/Card'

interface WelcomeBannerProps {
  firstName: string
  onWritePost: () => void
}

const DISMISSED_KEY = 'lankapros_welcome_dismissed'

export default function WelcomeBanner({ firstName, onWritePost }: WelcomeBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <Card className="border-[#D4A843]/40 bg-card relative overflow-hidden">
      {/* Gold accent left bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4A843] rounded-l-xl" />

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss welcome banner"
        className="absolute top-3 right-3 p-1 rounded-full text-muted hover:text-foreground hover:bg-card-hover transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pl-4 pr-8">
        {/* Heading */}
        <div className="mb-1">
          <h2 className="text-xl font-bold text-foreground">
            Ayubowan, {firstName}! 🌿 You&apos;re in.
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Sri Lanka&apos;s professional network is live. Here&apos;s how to get started:
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <button
            onClick={() => { onWritePost(); dismiss() }}
            className="flex flex-col items-start gap-1.5 rounded-lg border border-[#D4A843]/25 bg-[#D4A843]/5 p-3 text-left hover:bg-[#D4A843]/10 hover:border-[#D4A843]/50 transition-colors"
          >
            <span className="text-2xl">📝</span>
            <span className="font-semibold text-sm text-foreground">Write your first post</span>
            <span className="text-xs text-muted">Share your story with the network</span>
          </button>

          <Link
            href="/connections"
            onClick={dismiss}
            className="flex flex-col items-start gap-1.5 rounded-lg border border-[#D4A843]/25 bg-[#D4A843]/5 p-3 hover:bg-[#D4A843]/10 hover:border-[#D4A843]/50 transition-colors"
          >
            <span className="text-2xl">👥</span>
            <span className="font-semibold text-sm text-foreground">Find connections</span>
            <span className="text-xs text-muted">Grow your Sri Lankan network</span>
          </Link>

          <Link
            href="/profile/edit"
            onClick={dismiss}
            className="flex flex-col items-start gap-1.5 rounded-lg border border-[#D4A843]/25 bg-[#D4A843]/5 p-3 hover:bg-[#D4A843]/10 hover:border-[#D4A843]/50 transition-colors"
          >
            <span className="text-2xl">✏️</span>
            <span className="font-semibold text-sm text-foreground">Complete your profile</span>
            <span className="text-xs text-muted">Stand out to Sri Lankan pros</span>
          </Link>
        </div>
      </div>
    </Card>
  )
}

'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'lankapros-cookie-consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const accepted = localStorage.getItem(STORAGE_KEY)
      if (!accepted) setVisible(true)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-muted">
          We use essential cookies for authentication and session management.
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 px-5 py-2 rounded-lg bg-accent text-black text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  )
}

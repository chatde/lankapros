'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ECONOMY_TABS } from '@/lib/economy/constants'

export default function EconomyNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {ECONOMY_TABS.map((tab) => {
        const isActive = tab.href === '/economy'
          ? pathname === '/economy'
          : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-accent text-black'
                : 'text-muted hover:text-foreground hover:bg-card'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { fetchCSETopMovers } from '@/lib/economy/api'
import { formatNumber } from '@/lib/economy/format'
import type { CSETopMover } from '@/lib/economy/types'
import { cn } from '@/lib/utils'

export default function TopMoversTable() {
  const [gainers, setGainers] = useState<CSETopMover[]>([])
  const [losers, setLosers] = useState<CSETopMover[]>([])
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await fetchCSETopMovers()
      setGainers(data.gainers)
      setLosers(data.losers)
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  const movers = tab === 'gainers' ? gainers : losers

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setTab('gainers')}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium transition-colors',
            tab === 'gainers' ? 'bg-success/20 text-success' : 'text-muted hover:text-foreground'
          )}
        >
          Top Gainers
        </button>
        <button
          onClick={() => setTab('losers')}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium transition-colors',
            tab === 'losers' ? 'bg-danger/20 text-danger' : 'text-muted hover:text-foreground'
          )}
        >
          Top Losers
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-border rounded" />
          ))}
        </div>
      ) : movers.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">No data — market may be closed</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted border-b border-border">
                <th className="text-left py-2 font-medium">Symbol</th>
                <th className="text-right py-2 font-medium">Price</th>
                <th className="text-right py-2 font-medium">Change</th>
                <th className="text-right py-2 font-medium hidden sm:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {movers.map((m) => (
                <tr key={m.symbol} className="border-b border-border/50 last:border-0">
                  <td className="py-2">
                    <p className="font-medium text-foreground">{m.symbol}</p>
                    <p className="text-xs text-muted truncate max-w-[120px]">{m.name}</p>
                  </td>
                  <td className="text-right font-mono text-foreground">{m.price.toFixed(2)}</td>
                  <td className={cn('text-right font-mono', m.change >= 0 ? 'text-success' : 'text-danger')}>
                    {m.change >= 0 ? '+' : ''}{m.changePercent.toFixed(2)}%
                  </td>
                  <td className="text-right text-muted hidden sm:table-cell">{formatNumber(m.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

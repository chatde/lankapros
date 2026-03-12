'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { Loader2 } from 'lucide-react'
import type { CommodityPrice } from '@/lib/economy/types'

function formatLkr(n: number): string {
  if (n >= 1_000_000) return `₨${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `₨${n.toLocaleString('en-LK')}`
  return `₨${n.toFixed(2)}`
}

const CONTEXT: Record<string, string> = {
  XAU: 'Gold is central to Sri Lankan weddings, savings, and wealth. Pawning gold jewelry remains a primary credit source for millions of families.',
  XAG: 'Silver is used in religious ceremonies, jewellery, and industrial manufacturing across Sri Lanka.',
  OIL: 'Brent crude directly sets Sri Lanka\'s fuel import cost. CPC adjusts pump prices monthly based on global crude movements.',
}

export default function CommoditiesDashboard() {
  const [commodities, setCommodities] = useState<CommodityPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/economy/commodities')
      if (res.ok) {
        const data = await res.json() as CommodityPrice[]
        setCommodities(data)
        setUpdatedAt(new Date())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {commodities.map(c => (
          <Card key={c.symbol} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted">{c.symbol} · {c.unit}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold font-terminal">{formatLkr(c.priceLkr)}</p>
              <p className="text-xs text-muted mt-0.5">${c.priceUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD</p>
            </div>
            {CONTEXT[c.symbol] && (
              <p className="text-xs text-muted border-t border-border pt-2 leading-relaxed">
                {CONTEXT[c.symbol]}
              </p>
            )}
          </Card>
        ))}
      </div>

      {updatedAt && (
        <p className="text-xs text-muted text-right">
          Updated {updatedAt.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })} · via Yahoo Finance · refreshes every 5 min
        </p>
      )}

      <Card className="bg-card/50">
        <p className="text-xs text-muted">
          💡 <strong className="text-foreground">Gold pawning tip:</strong> Sri Lankans can pledge gold at licensed pawn brokers (including state banks) to access quick credit. The LKR price above reflects the current international market value before local premiums.
        </p>
      </Card>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { Loader2 } from 'lucide-react'
import type { CryptoPrice } from '@/lib/economy/types'

function formatLkr(n: number): string {
  if (n >= 1_000_000) return `₨${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `₨${(n / 1_000).toFixed(2)}K`
  return `₨${n.toFixed(2)}`
}

function formatUsd(n: number): string {
  if (n >= 1_000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${n.toFixed(4)}`
}

function ChangeChip({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
      {up ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

export default function CryptoDashboard() {
  const [coins, setCoins] = useState<CryptoPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/economy/crypto')
      if (res.ok) {
        const data = await res.json() as CryptoPrice[]
        setCoins(data)
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {coins.map(coin => (
          <Card key={coin.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent font-terminal">{coin.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{coin.name}</p>
                  <p className="text-xs text-muted">{coin.symbol}</p>
                </div>
              </div>
              <ChangeChip value={coin.change24h} />
            </div>
            <p className="text-2xl font-bold font-terminal">{formatLkr(coin.priceLkr)}</p>
            <p className="text-xs text-muted mt-1">{formatUsd(coin.priceUsd)}</p>
          </Card>
        ))}
      </div>

      {updatedAt && (
        <p className="text-xs text-muted text-right">
          Updated {updatedAt.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })} · via CoinGecko · refreshes every 5 min
        </p>
      )}

      <Card className="bg-amber-500/5 border-amber-500/20">
        <p className="text-xs text-amber-400/80">
          ⚠ Crypto assets are not regulated by the Central Bank of Sri Lanka. Prices are for informational purposes only.
        </p>
      </Card>
    </div>
  )
}

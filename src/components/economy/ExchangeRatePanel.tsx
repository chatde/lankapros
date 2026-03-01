'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { fetchExchangeRates } from '@/lib/economy/api'
import { formatExchangeRate } from '@/lib/economy/format'
import type { ExchangeRate } from '@/lib/economy/types'
import DataSourceTag from './DataSourceTag'

export default function ExchangeRatePanel() {
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await fetchExchangeRates()
      setRates(data)
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 300_000) // 5 min
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-border rounded" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">LKR Exchange Rates</p>
        <DataSourceTag source="fawazahmed0" />
      </div>
      <div className="space-y-2">
        {rates.map((rate) => (
          <div
            key={rate.code}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{rate.flag}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{rate.code}</p>
                <p className="text-xs text-muted">{rate.currency}</p>
              </div>
            </div>
            <p className="text-sm font-mono font-medium text-foreground">
              Rs {formatExchangeRate(rate.rate)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

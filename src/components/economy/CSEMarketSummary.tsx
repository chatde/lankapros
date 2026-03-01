'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import MetricCard from './MetricCard'
import ChangeIndicator from './ChangeIndicator'
import DataSourceTag from './DataSourceTag'
import { fetchCSEMarket } from '@/lib/economy/api'
import { formatNumber } from '@/lib/economy/format'
import type { CSEMarketData } from '@/lib/economy/types'

export default function CSEMarketSummary() {
  const [market, setMarket] = useState<CSEMarketData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await fetchCSEMarket()
      setMarket(data)
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 60_000) // 60s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCard key={i} label="" value="" loading />
        ))}
      </div>
    )
  }

  if (!market) {
    return (
      <Card>
        <p className="text-sm text-muted text-center py-4">CSE data unavailable — market may be closed</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted">All Share Price Index</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-foreground">
                {market.aspiIndex.toFixed(2)}
              </span>
              <ChangeIndicator value={market.aspiChangePercent} />
            </div>
            <p className="text-xs text-muted mt-1">
              {market.aspiChange >= 0 ? '+' : ''}{market.aspiChange.toFixed(2)} points
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              market.marketStatus === 'TRADING' ? 'bg-success/20 text-success' : 'bg-border text-muted'
            }`}>
              {market.marketStatus}
            </span>
            <DataSourceTag source="CSE" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="S&P SL 20"
          value={market.sp20Index.toFixed(2)}
          change={market.sp20ChangePercent}
        />
        <MetricCard
          label="Volume"
          value={formatNumber(market.totalVolume)}
          subtitle="Shares traded"
        />
        <MetricCard
          label="Turnover"
          value={`Rs ${formatNumber(market.totalTurnover)}`}
          subtitle={`${formatNumber(market.totalTrades)} trades`}
        />
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import MetricCard from './MetricCard'
import { fetchCSEMarket } from '@/lib/economy/api'
import { formatBillions, formatPercent } from '@/lib/economy/format'
import type { OverviewMetrics, Trend } from '@/lib/economy/types'

interface OverviewDashboardProps {
  serverMetrics: OverviewMetrics
}

export default function OverviewDashboard({ serverMetrics }: OverviewDashboardProps) {
  const [metrics, setMetrics] = useState(serverMetrics)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCSE() {
      const cse = await fetchCSEMarket()
      if (cse) {
        setMetrics((prev) => ({
          ...prev,
          aspiIndex: cse.aspiIndex,
          aspiChange: cse.aspiChangePercent,
        }))
      }
      setLoading(false)
    }
    loadCSE()
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <MetricCard
        label="GDP"
        value={metrics.gdp ? formatBillions(metrics.gdp) : '—'}
        subtitle="Current USD"
      />
      <MetricCard
        label="GDP Growth"
        value={metrics.gdpGrowth !== null ? formatPercent(metrics.gdpGrowth) : '—'}
        change={metrics.gdpGrowth ?? undefined}
        subtitle="Annual"
        trend={metrics.gdpGrowth !== null ? (metrics.gdpGrowth > 1 ? 'up' : metrics.gdpGrowth < -1 ? 'down' : 'flat') : undefined}
      />
      <MetricCard
        label="Inflation"
        value={metrics.inflation !== null ? `${metrics.inflation.toFixed(1)}%` : '—'}
        subtitle="CPI Annual"
        trend={metrics.inflation !== null ? (metrics.inflation > 5 ? 'up' : metrics.inflation < 2 ? 'down' : 'flat') : undefined}
      />
      <MetricCard
        label="USD / LKR"
        value={metrics.usdLkr ? `Rs ${metrics.usdLkr.toFixed(2)}` : '—'}
        subtitle="Exchange rate"
      />
      <MetricCard
        label="CSE ASPI"
        value={metrics.aspiIndex ? metrics.aspiIndex.toFixed(0) : '—'}
        change={metrics.aspiChange ?? undefined}
        subtitle="Colombo Stock Exchange"
        loading={loading}
        trend={metrics.aspiChange !== null ? (metrics.aspiChange > 1 ? 'up' : metrics.aspiChange < -1 ? 'down' : 'flat') : undefined}
      />
      <MetricCard
        label="Foreign Reserves"
        value={metrics.reserves ? formatBillions(metrics.reserves) : '—'}
        subtitle="Total reserves"
      />
    </div>
  )
}

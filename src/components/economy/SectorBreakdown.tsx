'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { fetchCSESectors } from '@/lib/economy/api'
import { formatNumber } from '@/lib/economy/format'
import type { CSESector } from '@/lib/economy/types'

const BarChartWidget = dynamic(() => import('./BarChartWidget'), { ssr: false })

export default function SectorBreakdown() {
  const [sectors, setSectors] = useState<CSESector[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await fetchCSESectors()
      setSectors(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse h-[300px] bg-card border border-border rounded-xl" />
    )
  }

  if (sectors.length === 0) {
    return null
  }

  const chartData = sectors
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, 10)
    .map((s) => ({
      name: s.sector.length > 15 ? s.sector.slice(0, 15) + '...' : s.sector,
      value: s.turnover,
    }))

  return (
    <BarChartWidget
      title="Top Sectors by Turnover"
      data={chartData}
      format={(v) => `Rs ${formatNumber(v)}`}
      source="CSE"
      layout="vertical"
    />
  )
}

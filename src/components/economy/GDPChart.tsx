'use client'

import TimeSeriesChart from './TimeSeriesChart'
import { formatBillions } from '@/lib/economy/format'
import type { TimeSeriesPoint } from '@/lib/economy/types'

interface GDPChartProps {
  gdp: TimeSeriesPoint[]
  gdpGrowth: TimeSeriesPoint[]
}

export default function GDPChart({ gdp, gdpGrowth }: GDPChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <TimeSeriesChart
        title="GDP (Current USD)"
        data={gdp}
        format={formatBillions}
        source="World Bank"
      />
      <TimeSeriesChart
        title="GDP Growth Rate (%)"
        data={gdpGrowth}
        format={(v) => `${v.toFixed(1)}%`}
        source="IMF"
        showForecast
      />
    </div>
  )
}

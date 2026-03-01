'use client'

import TimeSeriesChart from './TimeSeriesChart'
import SectionHeader from './SectionHeader'
import OverviewDashboard from './OverviewDashboard'
import type { OverviewMetrics, TimeSeriesPoint } from '@/lib/economy/types'

interface OverviewChartsProps {
  metrics: OverviewMetrics
  gdpGrowth: TimeSeriesPoint[]
}

export default function OverviewCharts({ metrics, gdpGrowth }: OverviewChartsProps) {
  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Key Indicators" subtitle="Latest available data" />
        <OverviewDashboard serverMetrics={metrics} />
      </div>
      <div>
        <SectionHeader title="GDP Growth Trend" subtitle="Historical + IMF forecast" />
        <TimeSeriesChart
          title="GDP Growth Rate (%)"
          data={gdpGrowth}
          format={(v) => `${v.toFixed(1)}%`}
          source="IMF WEO"
          showForecast
          height={320}
        />
      </div>
    </div>
  )
}

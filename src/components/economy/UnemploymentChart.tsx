'use client'

import TimeSeriesChart from './TimeSeriesChart'
import type { TimeSeriesPoint } from '@/lib/economy/types'

interface UnemploymentChartProps {
  unemployment: TimeSeriesPoint[]
}

export default function UnemploymentChart({ unemployment }: UnemploymentChartProps) {
  return (
    <TimeSeriesChart
      title="Unemployment Rate (%)"
      data={unemployment}
      format={(v) => `${v.toFixed(1)}%`}
      source="IMF"
      showForecast
    />
  )
}

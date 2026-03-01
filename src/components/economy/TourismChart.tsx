'use client'

import TimeSeriesChart from './TimeSeriesChart'
import { formatNumber, formatBillions } from '@/lib/economy/format'
import { CHART_COLORS } from '@/lib/economy/constants'
import type { TimeSeriesPoint } from '@/lib/economy/types'

interface TourismChartProps {
  arrivals: TimeSeriesPoint[]
  receipts: TimeSeriesPoint[]
}

export default function TourismChart({ arrivals, receipts }: TourismChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <TimeSeriesChart
        title="Tourist Arrivals"
        data={arrivals}
        format={(v) => formatNumber(v)}
        source="World Bank"
        color={CHART_COLORS.success}
      />
      <TimeSeriesChart
        title="Tourism Receipts (USD)"
        data={receipts}
        format={formatBillions}
        source="World Bank"
      />
    </div>
  )
}

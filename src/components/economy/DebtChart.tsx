'use client'

import TimeSeriesChart from './TimeSeriesChart'
import type { TimeSeriesPoint } from '@/lib/economy/types'
import { CHART_COLORS } from '@/lib/economy/constants'

interface DebtChartProps {
  debtToGdp: TimeSeriesPoint[]
}

export default function DebtChart({ debtToGdp }: DebtChartProps) {
  return (
    <TimeSeriesChart
      title="Government Debt (% of GDP)"
      data={debtToGdp}
      format={(v) => `${v.toFixed(0)}%`}
      source="IMF"
      color={CHART_COLORS.danger}
      showForecast
    />
  )
}

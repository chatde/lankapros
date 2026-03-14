'use client'

import dynamic from 'next/dynamic'
import Card from '@/components/ui/Card'
import { CHART_COLORS } from '@/lib/economy/constants'
import type { TimeSeriesPoint } from '@/lib/economy/types'
import DataSourceTag from './DataSourceTag'

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const ComposedChart = dynamic(() => import('recharts').then(m => m.ComposedChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })

interface RainfallPatternChartProps {
  data: TimeSeriesPoint[]
  title?: string
}

export default function RainfallPatternChart({ data, title = 'Rainfall Intensity Trend (mm per rainy day)' }: RainfallPatternChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <p className="text-sm font-medium text-foreground mb-2">{title}</p>
        <div className="h-40 flex items-center justify-center text-muted text-sm">No data available</div>
      </Card>
    )
  }

  // Compute 5-year moving average
  const withAvg = data.map((d, i) => {
    const window = data.slice(Math.max(0, i - 4), i + 1)
    const avg = window.reduce((s, p) => s + p.value, 0) / window.length
    return { year: d.year, intensity: Number(d.value.toFixed(1)), trend: Number(avg.toFixed(1)) }
  })

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <DataSourceTag source="Open-Meteo Archive" />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={withAvg} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.tooltip,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: CHART_COLORS.text }}
          />
          <Bar dataKey="intensity" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth={1} radius={[2, 2, 0, 0]} name="Intensity (mm/day)" />
          <Line type="monotone" dataKey="trend" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} name="5yr Trend" />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  )
}

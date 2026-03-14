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

interface BrainDrainChartProps {
  migrationData: TimeSeriesPoint[]
  enrollmentData?: TimeSeriesPoint[]
}

export default function BrainDrainChart({ migrationData, enrollmentData }: BrainDrainChartProps) {
  if (migrationData.length === 0) {
    return (
      <Card>
        <p className="text-sm font-medium text-foreground mb-2">Human Capital Flight</p>
        <div className="h-40 flex items-center justify-center text-muted text-sm">No data available</div>
      </Card>
    )
  }

  const years = new Set<number>()
  migrationData.forEach(d => years.add(d.year))
  enrollmentData?.forEach(d => years.add(d.year))

  const merged = Array.from(years).sort().map(year => ({
    year,
    migration: migrationData.find(d => d.year === year)?.value,
    enrollment: enrollmentData?.find(d => d.year === year)?.value,
  })).filter(d => d.migration !== undefined || d.enrollment !== undefined)

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">Net Migration vs Tertiary Enrollment</p>
        <DataSourceTag source="World Bank" />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={merged} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.tooltip,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: CHART_COLORS.text }}
            formatter={(val: unknown) => [Number(val).toLocaleString(), '']}
          />
          <Bar yAxisId="left" dataKey="migration" fill="rgba(239, 68, 68, 0.5)" stroke="#ef4444" strokeWidth={1} radius={[2, 2, 0, 0]} name="migration" />
          <Line yAxisId="right" type="monotone" dataKey="enrollment" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} name="enrollment" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[#888888]">
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-500/50 rounded-sm inline-block" /> Net Migration</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#D4A843] inline-block" /> Tertiary Enrollment %</span>
      </div>
    </Card>
  )
}

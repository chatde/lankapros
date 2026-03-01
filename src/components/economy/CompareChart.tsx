'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { CHART_COLORS } from '@/lib/economy/constants'

interface DataPoint {
  year: number
  value: number
}

interface CompareChartProps {
  lkaData: DataPoint[]
  otherData: DataPoint[]
  lkaLabel: string
  otherLabel: string
  title: string
  formatter?: (value: number) => string
}

const CYAN = '#06b6d4'

export default function CompareChart({
  lkaData,
  otherData,
  lkaLabel,
  otherLabel,
  title,
  formatter = (v) => v.toFixed(1),
}: CompareChartProps) {
  if (lkaData.length === 0 && otherData.length === 0) {
    return (
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
        <p className="text-sm font-medium text-foreground mb-2">{title}</p>
        <div className="h-40 flex items-center justify-center text-muted text-sm">
          No data available
        </div>
      </div>
    )
  }

  // Merge both datasets by year
  const yearMap = new Map<number, { year: number; lka?: number; other?: number }>()

  for (const d of lkaData) {
    yearMap.set(d.year, { year: d.year, lka: d.value })
  }
  for (const d of otherData) {
    const existing = yearMap.get(d.year)
    if (existing) {
      existing.other = d.value
    } else {
      yearMap.set(d.year, { year: d.year, other: d.value })
    }
  }

  const merged = Array.from(yearMap.values()).sort((a, b) => a.year - b.year)

  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
      <p className="text-sm font-medium text-foreground mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={merged} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
            tickFormatter={formatter}
            width={65}
          />
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.tooltip,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: CHART_COLORS.text }}
            formatter={(val: unknown, name?: string) => {
              const label = name === 'lka' ? lkaLabel : otherLabel
              return [formatter(Number(val)), label]
            }}
          />
          <Line
            type="monotone"
            dataKey="lka"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={false}
            connectNulls
            name="lka"
          />
          <Line
            type="monotone"
            dataKey="other"
            stroke={CYAN}
            strokeWidth={2}
            dot={false}
            connectNulls
            name="other"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded" style={{ background: CHART_COLORS.primary }} />
          {lkaLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded" style={{ background: CYAN }} />
          {otherLabel}
        </span>
      </div>
    </div>
  )
}

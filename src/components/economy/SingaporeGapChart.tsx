'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { CHART_COLORS } from '@/lib/economy/constants'
import type { GapDataPoint } from '@/lib/economy/intelligence-compute'

interface SingaporeGapChartProps {
  data: GapDataPoint[]
  sgpMatchYear: number | null
}

export default function SingaporeGapChart({ data, sgpMatchYear }: SingaporeGapChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
        <p className="text-sm text-[#888888]">No comparison data available</p>
      </div>
    )
  }

  const formatUSD = (v: number) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`
    return `$${v.toFixed(0)}`
  }

  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white">GDP per Capita — Sri Lanka vs Regional Benchmark</p>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#D4A843] inline-block" />
            Sri Lanka
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#06b6d4] inline-block" />
            Singapore
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
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
            tickFormatter={formatUSD}
            width={55}
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
              const label = name === 'lkaValue' ? 'Sri Lanka' : 'Singapore'
              return [`$${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, label]
            }}
          />
          <Line
            type="monotone"
            dataKey="lkaValue"
            stroke="#D4A843"
            strokeWidth={2.5}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="sgpValue"
            stroke="#06b6d4"
            strokeWidth={2.5}
            dot={false}
            connectNulls
          />
          {sgpMatchYear && (
            <ReferenceLine
              x={sgpMatchYear}
              stroke="#D4A843"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{
                value: `SGP was here (${sgpMatchYear})`,
                fill: '#D4A843',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

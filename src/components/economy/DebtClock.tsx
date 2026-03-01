'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { CHART_COLORS } from '@/lib/economy/constants'
import type { DebtProjection } from '@/lib/economy/intelligence-compute'

interface DebtClockProps {
  data: DebtProjection[]
}

export default function DebtClock({ data }: DebtClockProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
        <p className="text-sm text-[#888888]">No debt projection data available</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white">Debt-to-GDP Projections (% of GDP)</p>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#ef4444] inline-block" />
            Current
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#eab308] inline-block" style={{ borderTop: '2px dashed #eab308', height: 0 }} />
            6% Growth
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#22c55e] inline-block" style={{ borderTop: '2px dashed #22c55e', height: 0 }} />
            8% Growth
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
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
            tickFormatter={(v: number) => `${v}%`}
            width={50}
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
              const labels: Record<string, string> = {
                currentPath: 'Current Trajectory',
                accelerated: 'Accelerated (6%)',
                exportLed: 'Export-Led (8%)',
              }
              return [`${Number(val).toFixed(1)}%`, labels[name ?? ''] ?? name]
            }}
          />
          <ReferenceLine
            y={60}
            stroke="#D4A843"
            strokeDasharray="6 3"
            strokeOpacity={0.5}
            label={{
              value: 'IMF Threshold (60%)',
              fill: '#D4A843',
              fontSize: 10,
              position: 'right',
            }}
          />
          <Line
            type="monotone"
            dataKey="currentPath"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="accelerated"
            stroke="#eab308"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="exportLed"
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

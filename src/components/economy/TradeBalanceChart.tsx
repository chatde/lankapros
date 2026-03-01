'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import Card from '@/components/ui/Card'
import { CHART_COLORS } from '@/lib/economy/constants'
import { formatBillions } from '@/lib/economy/format'
import type { TimeSeriesPoint } from '@/lib/economy/types'
import DataSourceTag from './DataSourceTag'

interface TradeBalanceChartProps {
  exports: TimeSeriesPoint[]
  imports: TimeSeriesPoint[]
}

export default function TradeBalanceChart({ exports: exp, imports: imp }: TradeBalanceChartProps) {
  // Merge by year
  const years = new Set([...exp.map((d) => d.year), ...imp.map((d) => d.year)])
  const data = Array.from(years)
    .sort()
    .map((year) => ({
      year,
      exports: exp.find((d) => d.year === year)?.value ?? 0,
      imports: imp.find((d) => d.year === year)?.value ?? 0,
    }))

  if (data.length === 0) {
    return (
      <Card>
        <p className="text-sm font-medium text-foreground mb-2">Trade Balance</p>
        <div className="h-40 flex items-center justify-center text-muted text-sm">No data available</div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">Exports vs Imports</p>
        <DataSourceTag source="World Bank" />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
            tickFormatter={formatBillions}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.tooltip,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(val: unknown, name?: string) => [formatBillions(Number(val)), name === 'exports' ? 'Exports' : 'Imports']}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: CHART_COLORS.text }}
          />
          <Area
            type="monotone"
            dataKey="exports"
            name="Exports"
            stroke={CHART_COLORS.exports}
            fill={CHART_COLORS.exports}
            fillOpacity={0.15}
            strokeWidth={2}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="imports"
            name="Imports"
            stroke={CHART_COLORS.imports}
            fill={CHART_COLORS.imports}
            fillOpacity={0.15}
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

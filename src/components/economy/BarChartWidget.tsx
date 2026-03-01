'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Card from '@/components/ui/Card'
import { CHART_COLORS } from '@/lib/economy/constants'
import DataSourceTag from './DataSourceTag'

interface BarChartWidgetProps {
  title: string
  data: Array<{ name: string; value: number; color?: string }>
  format?: (value: number) => string
  source?: string
  color?: string
  height?: number
  layout?: 'vertical' | 'horizontal'
}

export default function BarChartWidget({
  title,
  data,
  format = (v) => v.toFixed(1),
  source,
  color = CHART_COLORS.primary,
  height = 300,
  layout = 'horizontal',
}: BarChartWidgetProps) {
  if (data.length === 0) {
    return (
      <Card>
        <p className="text-sm font-medium text-foreground mb-2">{title}</p>
        <div className="h-40 flex items-center justify-center text-muted text-sm">No data available</div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {source && <DataSourceTag source={source} />}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={layout === 'vertical' ? 'vertical' : 'horizontal'} margin={{ top: 5, right: 5, bottom: 5, left: layout === 'vertical' ? 80 : 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          {layout === 'vertical' ? (
            <>
              <XAxis type="number" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickFormatter={format} />
              <YAxis type="category" dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} width={75} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickFormatter={format} />
            </>
          )}
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.tooltip,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(val: unknown) => [format(Number(val)), title]}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

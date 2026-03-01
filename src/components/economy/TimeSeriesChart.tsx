'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import Card from '@/components/ui/Card'
import { CHART_COLORS } from '@/lib/economy/constants'
import type { TimeSeriesPoint } from '@/lib/economy/types'
import DataSourceTag from './DataSourceTag'

interface TimeSeriesChartProps {
  title: string
  data: TimeSeriesPoint[]
  dataKey?: string
  format?: (value: number) => string
  source?: string
  color?: string
  showForecast?: boolean
  height?: number
}

export default function TimeSeriesChart({
  title,
  data,
  format = (v) => v.toFixed(1),
  source,
  color = CHART_COLORS.primary,
  showForecast = false,
  height = 280,
}: TimeSeriesChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <p className="text-sm font-medium text-foreground mb-2">{title}</p>
        <div className="h-40 flex items-center justify-center text-muted text-sm">No data available</div>
      </Card>
    )
  }

  const currentYear = new Date().getFullYear()
  const historicalData = data.filter((d) => !d.forecast)
  const forecastData = showForecast ? data.filter((d) => d.forecast) : []

  // Merge for seamless line: last historical point + forecast
  const mergedData = showForecast && forecastData.length > 0 && historicalData.length > 0
    ? data.map((d) => ({
        year: d.year,
        value: !d.forecast ? d.value : undefined,
        forecast: d.forecast ? d.value : (d.year === historicalData.at(-1)?.year ? d.value : undefined),
      }))
    : data.map((d) => ({ year: d.year, value: d.value, forecast: undefined }))

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {source && <DataSourceTag source={source} />}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={mergedData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id={`fill-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={format}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.tooltip,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: CHART_COLORS.text }}
            formatter={(val: unknown) => [format(Number(val)), title]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#fill-${title.replace(/\s/g, '')})`}
            dot={false}
            connectNulls
          />
          {showForecast && (
            <Area
              type="monotone"
              dataKey="forecast"
              stroke={color}
              strokeWidth={2}
              strokeDasharray="6 3"
              fill={CHART_COLORS.forecastFill}
              dot={false}
              connectNulls
            />
          )}
          {showForecast && forecastData.length > 0 && (
            <ReferenceLine
              x={currentYear}
              stroke={CHART_COLORS.text}
              strokeDasharray="3 3"
              label={{ value: 'Forecast →', fill: CHART_COLORS.text, fontSize: 10, position: 'top' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

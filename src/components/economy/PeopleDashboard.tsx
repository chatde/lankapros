'use client'

import dynamic from 'next/dynamic'
import MetricCard from './MetricCard'
import SectionHeader from './SectionHeader'
import Card from '@/components/ui/Card'
import { calculateTrend } from '@/lib/economy/format'
import { CHART_COLORS } from '@/lib/economy/constants'
import type { PeopleData } from '@/lib/economy/people-api'
import type { TimeSeriesPoint } from '@/lib/economy/types'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

const TimeSeriesChart = dynamic(() => import('./TimeSeriesChart'), { ssr: false })

interface PeopleDashboardProps {
  data: PeopleData
}

function getLatest(series: TimeSeriesPoint[]): number | null {
  return series.length > 0 ? series[series.length - 1].value : null
}

function formatPopulation(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toFixed(0)
}

interface DualSeriesPoint {
  year: number
  series1: number | null
  series2: number | null
}

function mergeSeries(
  s1: TimeSeriesPoint[],
  s2: TimeSeriesPoint[],
): DualSeriesPoint[] {
  const map = new Map<number, DualSeriesPoint>()
  for (const p of s1) {
    map.set(p.year, { year: p.year, series1: p.value, series2: null })
  }
  for (const p of s2) {
    const existing = map.get(p.year)
    if (existing) {
      existing.series2 = p.value
    } else {
      map.set(p.year, { year: p.year, series1: null, series2: p.value })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.year - b.year)
}

function DualChart({
  title,
  data,
  label1,
  label2,
  color1 = CHART_COLORS.primary,
  color2 = CHART_COLORS.danger,
  format = (v: number) => v.toFixed(1),
}: {
  title: string
  data: DualSeriesPoint[]
  label1: string
  label2: string
  color1?: string
  color2?: string
  format?: (v: number) => string
}) {
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
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id={`fill1-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color1} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color1} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`fill2-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color2} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color2} stopOpacity={0} />
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
            formatter={(val: unknown, name?: string) => [format(Number(val)), name === 'series1' ? label1 : label2]}
          />
          <Legend
            formatter={(value: string) => (value === 'series1' ? label1 : label2)}
            wrapperStyle={{ fontSize: 11, color: CHART_COLORS.text }}
          />
          <Area
            type="monotone"
            dataKey="series1"
            name="series1"
            stroke={color1}
            strokeWidth={2}
            fill={`url(#fill1-${title.replace(/\s/g, '')})`}
            dot={false}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="series2"
            name="series2"
            stroke={color2}
            strokeWidth={2}
            fill={`url(#fill2-${title.replace(/\s/g, '')})`}
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

export default function PeopleDashboard({ data }: PeopleDashboardProps) {
  const latestPop = getLatest(data.population)
  const latestLifeExp = getLatest(data.lifeExpectancy)
  const latestLiteracy = getLatest(data.literacy)
  const latestInternet = getLatest(data.internetUsers)

  const birthDeathData = mergeSeries(data.birthRate, data.deathRate)
  const enrollmentData = mergeSeries(data.primaryEnrollment, data.secondaryEnrollment)

  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Population"
          value={latestPop !== null ? formatPopulation(latestPop) : 'N/A'}
          trend={calculateTrend(data.population)}
        />
        <MetricCard
          label="Life Expectancy"
          value={latestLifeExp !== null ? `${latestLifeExp.toFixed(1)} years` : 'N/A'}
          trend={calculateTrend(data.lifeExpectancy)}
        />
        <MetricCard
          label="Literacy Rate"
          value={latestLiteracy !== null ? `${latestLiteracy.toFixed(1)}%` : 'N/A'}
          trend={calculateTrend(data.literacy)}
        />
        <MetricCard
          label="Internet Users"
          value={latestInternet !== null ? `${latestInternet.toFixed(1)}%` : 'N/A'}
          trend={calculateTrend(data.internetUsers)}
        />
      </div>

      {/* Population & Demographics */}
      <section>
        <SectionHeader title="Population & Demographics" subtitle="Total population and growth rate trends" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <TimeSeriesChart
            title="Total Population"
            data={data.population}
            format={formatPopulation}
            source="World Bank"
          />
          <TimeSeriesChart
            title="Population Growth Rate (%)"
            data={data.popGrowth}
            format={(v) => `${v.toFixed(2)}%`}
            source="World Bank"
          />
        </div>
      </section>

      {/* Health & Wellbeing */}
      <section>
        <SectionHeader title="Health & Wellbeing" subtitle="Life expectancy and vital statistics" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <TimeSeriesChart
            title="Life Expectancy (years)"
            data={data.lifeExpectancy}
            format={(v) => v.toFixed(1)}
            source="World Bank"
          />
          <DualChart
            title="Birth Rate vs Death Rate (per 1,000)"
            data={birthDeathData}
            label1="Birth Rate"
            label2="Death Rate"
            color1={CHART_COLORS.primary}
            color2={CHART_COLORS.danger}
            format={(v) => v.toFixed(1)}
          />
        </div>
      </section>

      {/* Education */}
      <section>
        <SectionHeader title="Education" subtitle="Literacy and school enrollment rates" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <TimeSeriesChart
            title="Literacy Rate (%)"
            data={data.literacy}
            format={(v) => `${v.toFixed(1)}%`}
            source="World Bank"
          />
          <DualChart
            title="School Enrollment (% gross)"
            data={enrollmentData}
            label1="Primary"
            label2="Secondary"
            color1={CHART_COLORS.primary}
            color2={CHART_COLORS.success}
            format={(v) => `${v.toFixed(0)}%`}
          />
        </div>
      </section>

      {/* Digital & Urban */}
      <section>
        <SectionHeader title="Digital & Urban" subtitle="Connectivity and urbanization trends" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <TimeSeriesChart
            title="Internet Users (%)"
            data={data.internetUsers}
            format={(v) => `${v.toFixed(1)}%`}
            source="World Bank"
          />
          <TimeSeriesChart
            title="Mobile Subscriptions (per 100)"
            data={data.mobileSubscriptions}
            format={(v) => v.toFixed(0)}
            source="World Bank"
          />
          <TimeSeriesChart
            title="Urbanization (%)"
            data={data.urbanPop}
            format={(v) => `${v.toFixed(1)}%`}
            source="World Bank"
          />
        </div>
      </section>
    </div>
  )
}

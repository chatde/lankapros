'use client'

import { useState, useMemo } from 'react'
import TimeSeriesChart from './TimeSeriesChart'
import SectionHeader from './SectionHeader'
import OverviewDashboard from './OverviewDashboard'
import TimeMachine from './TimeMachine'
import type { OverviewMetrics, TimeSeriesPoint } from '@/lib/economy/types'

interface HistoricalData {
  gdp: TimeSeriesPoint[]
  inflation: TimeSeriesPoint[]
  reserves: TimeSeriesPoint[]
}

interface OverviewChartsProps {
  metrics: OverviewMetrics
  gdpGrowth: TimeSeriesPoint[]
  historicalData?: HistoricalData
}

export default function OverviewCharts({ metrics, gdpGrowth, historicalData }: OverviewChartsProps) {
  const currentYear = new Date().getFullYear()
  const minYear = currentYear - 15
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const isLive = selectedYear === currentYear

  const timeAdjustedMetrics = useMemo<OverviewMetrics>(() => {
    if (isLive || !historicalData) return metrics

    const findValue = (data: TimeSeriesPoint[], year: number): number | null => {
      const point = data.find((d) => d.year === year)
      return point?.value ?? null
    }

    const gdpGrowthPoint = gdpGrowth.find((d) => d.year === selectedYear)

    return {
      gdp: findValue(historicalData.gdp, selectedYear),
      gdpGrowth: gdpGrowthPoint?.value ?? null,
      inflation: findValue(historicalData.inflation, selectedYear),
      usdLkr: null, // No historical exchange rate data
      aspiIndex: null,
      aspiChange: null,
      reserves: findValue(historicalData.reserves, selectedYear),
    }
  }, [selectedYear, isLive, metrics, historicalData, gdpGrowth])

  return (
    <div className="space-y-6">
      {historicalData && (
        <TimeMachine
          minYear={minYear}
          maxYear={currentYear}
          value={selectedYear}
          onChange={setSelectedYear}
        />
      )}
      <div>
        <SectionHeader
          title="Key Indicators"
          subtitle={isLive ? 'Latest available data' : `Data from ${selectedYear}`}
        />
        <OverviewDashboard serverMetrics={timeAdjustedMetrics} />
      </div>
      <div>
        <SectionHeader title="GDP Growth Trend" subtitle="Historical + IMF forecast" />
        <TimeSeriesChart
          title="GDP Growth Rate (%)"
          data={gdpGrowth}
          format={(v) => `${v.toFixed(1)}%`}
          source="IMF WEO"
          showForecast
          height={320}
        />
      </div>
    </div>
  )
}

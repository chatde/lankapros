'use client'

import dynamic from 'next/dynamic'
import SectionHeader from './SectionHeader'
import { formatBillions } from '@/lib/economy/format'
import type { MacroData } from '@/lib/economy/types'

const GDPChart = dynamic(() => import('./GDPChart'), { ssr: false })
const DebtChart = dynamic(() => import('./DebtChart'), { ssr: false })
const TradeBalanceChart = dynamic(() => import('./TradeBalanceChart'), { ssr: false })
const TimeSeriesChart = dynamic(() => import('./TimeSeriesChart'), { ssr: false })

interface MacroChartsProps {
  data: MacroData
}

export default function MacroCharts({ data }: MacroChartsProps) {
  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Gross Domestic Product" subtitle="GDP value and growth rate with IMF forecasts" />
        <GDPChart gdp={data.gdp} gdpGrowth={data.gdpGrowth} />
      </div>
      <div>
        <SectionHeader title="Inflation" subtitle="Consumer Price Index annual change with IMF forecasts" />
        <TimeSeriesChart
          title="Inflation Rate (%)"
          data={data.inflation}
          format={(v) => `${v.toFixed(1)}%`}
          source="IMF"
          showForecast
        />
      </div>
      <div>
        <SectionHeader title="Government Debt" subtitle="Central government debt as percentage of GDP" />
        <DebtChart debtToGdp={data.debtToGdp} />
      </div>
      <div>
        <SectionHeader title="Trade" subtitle="Exports and imports of goods and services" />
        <TradeBalanceChart exports={data.exports} imports={data.imports} />
      </div>
      <div>
        <SectionHeader title="Foreign Reserves" subtitle="Total reserves including gold" />
        <TimeSeriesChart
          title="Foreign Reserves (USD)"
          data={data.reserves}
          format={formatBillions}
          source="World Bank"
        />
      </div>
    </div>
  )
}

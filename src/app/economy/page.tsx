import { Suspense } from 'react'
import { fetchOverviewMetrics, fetchIMFForecast, fetchWorldBank } from '@/lib/economy/api'
import { IMF_INDICATORS, WB_INDICATORS } from '@/lib/economy/constants'
import OverviewCharts from '@/components/economy/OverviewCharts'
import EconomyLoading from './loading'

async function OverviewContent() {
  const [metrics, imfGdpGrowth, wbGdpGrowth, gdpHistory, inflationHistory, reservesHistory] = await Promise.all([
    fetchOverviewMetrics(),
    fetchIMFForecast(IMF_INDICATORS.gdpGrowth),
    fetchWorldBank(WB_INDICATORS.gdpGrowth),
    fetchWorldBank(WB_INDICATORS.gdp),
    fetchWorldBank(WB_INDICATORS.inflation),
    fetchWorldBank(WB_INDICATORS.reserves),
  ])

  // Use IMF data if available (has forecasts), fall back to World Bank
  const gdpGrowth = imfGdpGrowth.length > 0 ? imfGdpGrowth : wbGdpGrowth

  return (
    <OverviewCharts
      metrics={metrics}
      gdpGrowth={gdpGrowth}
      historicalData={{
        gdp: gdpHistory,
        gdpGrowth: wbGdpGrowth,
        inflation: inflationHistory,
        reserves: reservesHistory,
      }}
    />
  )
}

export default function EconomyPage() {
  return (
    <Suspense fallback={<EconomyLoading />}>
      <OverviewContent />
    </Suspense>
  )
}

import { Suspense } from 'react'
import { fetchOverviewMetrics, fetchIMFForecast } from '@/lib/economy/api'
import { IMF_INDICATORS } from '@/lib/economy/constants'
import OverviewCharts from '@/components/economy/OverviewCharts'
import EconomyLoading from './loading'

async function OverviewContent() {
  const [metrics, gdpGrowth] = await Promise.all([
    fetchOverviewMetrics(),
    fetchIMFForecast(IMF_INDICATORS.gdpGrowth),
  ])

  return <OverviewCharts metrics={metrics} gdpGrowth={gdpGrowth} />
}

export default function EconomyPage() {
  return (
    <Suspense fallback={<EconomyLoading />}>
      <OverviewContent />
    </Suspense>
  )
}

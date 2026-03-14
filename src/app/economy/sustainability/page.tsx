import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchSustainabilityData } from '@/lib/economy/sustainability-api'
import SustainabilityDashboard from '@/components/economy/SustainabilityDashboard'
import EconomyLoading from '../loading'

export const metadata: Metadata = {
  title: 'Sustainability Blind Spots | LankaPros Economy',
  description: 'AI-identified sustainability metrics that Sri Lanka should be tracking but isn\'t — monsoon shifts, brain drain, coastal loss, food dependency, and groundwater contamination.',
}

async function SustainabilityContent() {
  const data = await fetchSustainabilityData()
  return <SustainabilityDashboard data={data} />
}

export default function SustainabilityPage() {
  return (
    <Suspense fallback={<EconomyLoading />}>
      <SustainabilityContent />
    </Suspense>
  )
}

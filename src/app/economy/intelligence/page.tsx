import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchIntelligenceData } from '@/lib/economy/intelligence-api'
import IntelligenceDashboard from '@/components/economy/IntelligenceDashboard'
import EconomyLoading from '../loading'

export const metadata: Metadata = {
  title: 'Strategic Intelligence | LankaPros Economy',
  description: 'AI-computed national intelligence — Sri Lanka vs Singapore trajectory, sector opportunities, debt sustainability, and strategic outlook.',
}

async function IntelligenceContent() {
  const data = await fetchIntelligenceData()
  return <IntelligenceDashboard data={data} />
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<EconomyLoading />}>
      <IntelligenceContent />
    </Suspense>
  )
}

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchIntelligenceData } from '@/lib/economy/intelligence-api'
import IntelligenceDashboard from '@/components/economy/IntelligenceDashboard'
import EconomyLoading from '../loading'

export const metadata: Metadata = {
  title: 'Strategic Intelligence | LankaPros Economy',
  description: 'AI-computed strategic intelligence for Sri Lanka — development trajectory, sector opportunities, debt sustainability, human capital analysis, and 90-day outlook.',
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

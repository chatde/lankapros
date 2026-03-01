import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchMacroData, fetchSocialData } from '@/lib/economy/api'
import { fetchPeopleData } from '@/lib/economy/people-api'
import { computeScorecard } from '@/lib/economy/scorecard'
import PulseScore from '@/components/economy/PulseScore'
import EconomyLoading from '../loading'

export const metadata: Metadata = {
  title: 'Pulse Scorecard | LankaPros Economy',
  description: 'Sri Lanka Pulse Score — composite country health indicator across economic, financial, social, and infrastructure metrics.',
}

async function ScorecardContent() {
  const [macro, social, people] = await Promise.all([
    fetchMacroData(),
    fetchSocialData(),
    fetchPeopleData(),
  ])
  const scorecard = computeScorecard(macro, social, people)
  return <PulseScore scorecard={scorecard} />
}

export default function ScorecardPage() {
  return (
    <Suspense fallback={<EconomyLoading />}>
      <ScorecardContent />
    </Suspense>
  )
}

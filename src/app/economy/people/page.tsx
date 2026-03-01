import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchPeopleData } from '@/lib/economy/people-api'
import PeopleDashboard from '@/components/economy/PeopleDashboard'
import EconomyLoading from '../loading'

export const metadata: Metadata = {
  title: 'People | LankaPros Economy',
  description: 'Sri Lanka demographics — population, health, education, digital access, and urbanization trends.',
}

async function PeopleContent() {
  const data = await fetchPeopleData()
  return <PeopleDashboard data={data} />
}

export default function PeoplePage() {
  return (
    <Suspense fallback={<EconomyLoading />}>
      <PeopleContent />
    </Suspense>
  )
}

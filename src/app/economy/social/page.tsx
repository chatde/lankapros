import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchSocialData } from '@/lib/economy/api'
import SocialCharts from '@/components/economy/SocialCharts'
import EconomyLoading from '../loading'

export const metadata: Metadata = {
  title: 'Social Indicators | LankaPros Economy',
  description: 'Sri Lanka unemployment, tourism arrivals, and tourism receipts.',
}

async function SocialContent() {
  const data = await fetchSocialData()
  return <SocialCharts data={data} />
}

export default function SocialPage() {
  return (
    <Suspense fallback={<EconomyLoading />}>
      <SocialContent />
    </Suspense>
  )
}

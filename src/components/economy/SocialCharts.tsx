'use client'

import UnemploymentChart from './UnemploymentChart'
import TourismChart from './TourismChart'
import SectionHeader from './SectionHeader'
import type { SocialData } from '@/lib/economy/types'

interface SocialChartsProps {
  data: SocialData
}

export default function SocialCharts({ data }: SocialChartsProps) {
  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Unemployment" subtitle="Total unemployment rate with IMF forecasts" />
        <UnemploymentChart unemployment={data.unemployment} />
      </div>
      <div>
        <SectionHeader title="Tourism" subtitle="International arrivals and tourism receipts" />
        <TourismChart arrivals={data.tourismArrivals} receipts={data.tourismReceipts} />
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import CommoditiesDashboard from '@/components/economy/CommoditiesDashboard'
import SectionHeader from '@/components/economy/SectionHeader'
import DataSourceTag from '@/components/economy/DataSourceTag'

export const metadata: Metadata = {
  title: 'Commodities | LankaPros Economy',
  description: 'Live Gold, Silver and Brent Crude prices in Sri Lankan Rupees.',
}

export default function CommoditiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Commodities in LKR"
          subtitle="Gold, Silver and Brent Crude prices converted to Sri Lankan Rupees — updates every 5 minutes"
        />
        <DataSourceTag source="Yahoo Finance" />
      </div>
      <CommoditiesDashboard />
    </div>
  )
}

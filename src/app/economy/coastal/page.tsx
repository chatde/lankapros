import type { Metadata } from 'next'
import CoastalDashboard from '@/components/economy/CoastalDashboard'
import SectionHeader from '@/components/economy/SectionHeader'
import DataSourceTag from '@/components/economy/DataSourceTag'

export const metadata: Metadata = {
  title: 'Coastal Conditions | LankaPros Economy',
  description: 'Live ocean wave heights, sea temperatures and marine conditions at Sri Lanka\'s main harbours.',
}

export default function CoastalPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Coastal Conditions"
          subtitle="Live ocean data at Colombo, Galle, Trincomalee and Jaffna — updates every 15 minutes"
        />
        <DataSourceTag source="Open-Meteo Marine" />
      </div>
      <CoastalDashboard />
    </div>
  )
}

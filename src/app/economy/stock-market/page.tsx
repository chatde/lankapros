import type { Metadata } from 'next'
import CSEMarketSummary from '@/components/economy/CSEMarketSummary'
import TopMoversTable from '@/components/economy/TopMoversTable'
import SectorBreakdown from '@/components/economy/SectorBreakdown'
import SectionHeader from '@/components/economy/SectionHeader'

export const metadata: Metadata = {
  title: 'Stock Market | LankaPros Economy',
  description: 'Colombo Stock Exchange — ASPI, top gainers/losers, sector performance.',
}

export default function StockMarketPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Colombo Stock Exchange" subtitle="Live market data — updates every 60 seconds" />
      <CSEMarketSummary />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopMoversTable />
        <SectorBreakdown />
      </div>
    </div>
  )
}

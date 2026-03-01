import type { Metadata } from 'next'
import ExchangeRatePanel from '@/components/economy/ExchangeRatePanel'
import CurrencyConverter from '@/components/economy/CurrencyConverter'
import SectionHeader from '@/components/economy/SectionHeader'

export const metadata: Metadata = {
  title: 'Exchange Rates | LankaPros Economy',
  description: 'Live LKR exchange rates against major currencies.',
}

export default function ExchangeRatesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Exchange Rates" subtitle="LKR vs major currencies — updates every 5 minutes" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ExchangeRatePanel />
        </div>
        <div>
          <CurrencyConverter />
        </div>
      </div>
    </div>
  )
}
